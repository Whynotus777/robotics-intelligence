import { eq } from "drizzle-orm";
import type { Db } from "./client.js";
import { claims } from "./schema/claims.js";

/**
 * Closes an existing APPROVED claim and opens a replacement. The old row is preserved
 * with status SUPERSEDED and valid_to = the new claim's valid_from; nothing is overwritten.
 * Callers are responsible for evidence on the new claim and for recomputeCachedColumns.
 */
export async function supersedeClaim(
  db: Db,
  oldClaimId: string,
  replacement: typeof claims.$inferInsert,
): Promise<{ oldClaimId: string; newClaimId: string }> {
  return db.transaction(async (tx) => {
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
    return { oldClaimId, newClaimId: inserted!.id };
  });
}
