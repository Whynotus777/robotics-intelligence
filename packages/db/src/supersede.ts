import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "./client.js";
import { claims } from "./schema/claims.js";
import { entities } from "./schema/entities.js";
import { changeEvents } from "./schema/change-events.js";
import { recomputeCachedColumns } from "./recompute.js";
import { eventSummary, eventTypeForClaim, type ClaimFacts } from "./events.js";

/**
 * Closes an existing APPROVED claim and opens a replacement. The old row is preserved
 * with status SUPERSEDED and valid_to = the new claim's valid_from; nothing is overwritten.
 * This is a change-event writer: history, event, and cache update always travel together.
 */
export async function supersedeClaim(
  db: Db,
  oldClaimId: string,
  replacement: typeof claims.$inferInsert,
): Promise<{ oldClaimId: string; newClaimId: string }> {
  const result = await db.transaction(async (tx) => {
    const [old] = await tx.select().from(claims).where(eq(claims.id, oldClaimId));
    if (!old) throw new Error(`claim ${oldClaimId} not found`);
    if (old.status !== "APPROVED") throw new Error(`claim ${oldClaimId} is ${old.status}, not APPROVED`);
    if (replacement.validFrom < old.validFrom) throw new Error("replacement must not start before the claim it supersedes");
    await tx
      .update(claims)
      .set({ status: "SUPERSEDED", validTo: replacement.validFrom, updatedAt: new Date().toISOString() })
      .where(eq(claims.id, oldClaimId));
    const [inserted] = await tx
      .insert(claims)
      .values({ ...replacement, status: "APPROVED", validTo: null })
      .returning({ id: claims.id });
    const [subject] = await tx.select().from(entities).where(eq(entities.id, old.subjectEntityId));
    if (!subject) throw new Error(`subject ${old.subjectEntityId} not found`);
    const facts = async (row: {
      predicate: string; valueText: string | null; valueNumber: number | null; unit: string | null;
      isApproximate: boolean; valueEnum: string | null; valueDate: string | null; objectEntityId: string | null;
    }): Promise<ClaimFacts> => ({
      predicate: row.predicate, valueText: row.valueText, valueNumber: row.valueNumber, unit: row.unit,
      isApproximate: row.isApproximate, valueEnum: row.valueEnum, valueDate: row.valueDate,
      objectName: row.objectEntityId
        ? (await tx.select({ name: entities.name }).from(entities).where(eq(entities.id, row.objectEntityId)))[0]?.name ?? null
        : null,
    });
    await tx.insert(changeEvents).values({
      id: randomUUID(), eventType: eventTypeForClaim(old.predicate, subject.entityType), entityId: subject.id,
      beforeClaimId: oldClaimId, afterClaimId: inserted!.id, observedAt: replacement.observedAt,
      summary: eventSummary({
        subject,
        after: await facts({
          predicate: replacement.predicate, valueText: replacement.valueText ?? null,
          valueNumber: replacement.valueNumber ?? null, unit: replacement.unit ?? null,
          isApproximate: replacement.isApproximate ?? false, valueEnum: replacement.valueEnum ?? null,
          valueDate: replacement.valueDate ?? null, objectEntityId: replacement.objectEntityId ?? null,
        }),
        before: await facts(old),
      }),
    });
    return { oldClaimId, newClaimId: inserted!.id };
  });
  await recomputeCachedColumns(db);
  return result;
}
