import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import {
  approveClaim, changeEvents, claims, createDb, dueSources, entities, evidence, recomputeCachedColumns, recordSourceSnapshot,
  resolveEntity, reviewActions, sourceContentChanged, sourceSnapshots, sources, visibleClaims,
} from "./index.js";

const { db, close } = createDb();
afterAll(async () => close());

describe("0b pipeline substrate", () => {
  it("keeps PROPOSED candidates out of the public visibility rule and approval writes the audit/cache/event", async () => {
    const [robot] = await db.select().from(entities).where(eq(entities.slug, "figure-03"));
    const [source] = await db.select().from(sources).limit(1);
    expect(robot).toBeDefined(); expect(source).toBeDefined();
    const claimId = randomUUID(); const evidenceId = randomUUID();
    await db.insert(claims).values({
      id: claimId, subjectEntityId: robot!.id, predicate: "HAS_HEIGHT", valueNumber: 1.7, unit: "m", isApproximate: true,
      status: "PROPOSED", origin: "MANUAL", validFrom: "2026-09-01", observedAt: "2026-09-01T00:00:00.000Z", lastVerifiedAt: "2026-09-01T00:00:00.000Z",
    });
    await db.insert(evidence).values({ id: evidenceId, claimId, sourceId: source!.id, evidenceClass: "PRIMARY", confidence: "MEDIUM", observedAt: "2026-09-01T00:00:00.000Z" });
    expect(await db.select().from(claims).where(and(eq(claims.id, claimId), visibleClaims(null)))).toHaveLength(0);
    const approved = await approveClaim(db, { claimId, reviewer: "seeded-reviewer", reason: "published specification" });
    expect(approved.supersededClaimId).toBeNull();
    expect(await db.select().from(reviewActions).where(eq(reviewActions.claimId, claimId))).toHaveLength(1);
    expect(await db.select().from(changeEvents).where(eq(changeEvents.id, approved.eventId))).toHaveLength(1);
    const [updated] = await db.select().from(entities).where(eq(entities.id, robot!.id));
    expect(updated!.heightM).toBe(1.7);
    await db.delete(reviewActions).where(eq(reviewActions.claimId, claimId));
    await db.delete(changeEvents).where(eq(changeEvents.id, approved.eventId));
    await db.delete(evidence).where(eq(evidence.id, evidenceId));
    await db.delete(claims).where(eq(claims.id, claimId));
    await recomputeCachedColumns(db);
  });

  it("stops unchanged source content before extraction and only returns due non-NEVER sources", async () => {
    const [source] = await db.select().from(sources).limit(1); expect(source).toBeDefined();
    const now = "2026-09-04T00:00:00.000Z";
    await db.update(sources).set({ nextCheckAt: now, refreshCadence: "DAILY", contentHash: null }).where(eq(sources.id, source!.id));
    expect((await dueSources(db, now)).map((x) => x.id)).toContain(source!.id);
    await recordSourceSnapshot(db, { sourceId: source!.id, fetchedAt: now, contentHash: "same-hash", snapshotPointer: "test://snapshot/one" });
    const second = await recordSourceSnapshot(db, { sourceId: source!.id, fetchedAt: now, contentHash: "same-hash", snapshotPointer: "test://snapshot/two" });
    expect(second.changed).toBe(false);
    expect(sourceContentChanged("same-hash", "same-hash")).toBe(false);
    const [updated] = await db.select().from(sources).where(eq(sources.id, source!.id));
    expect(updated!.extractionStatus).toBe("UNCHANGED");
    await db.update(sources).set({ nextCheckAt: null, refreshCadence: "MANUAL", contentHash: null, fetchedAt: null, latestSnapshotId: null, extractionStatus: "PENDING" }).where(eq(sources.id, source!.id));
    await db.delete(sourceSnapshots).where(eq(sourceSnapshots.sourceId, source!.id));
  });

  it("resolves canonical and legal-name aliases to Universal Robots", async () => {
    const expected = (await db.select().from(entities).where(eq(entities.slug, "universal-robots")))[0]!.id;
    for (const value of ["Universal Robots", "UR", "Universal Robots A/S"]) {
      const [result] = await resolveEntity(db, value);
      expect(result?.entity.id, value).toBe(expected);
      expect(result?.exact, value).toBe(true);
    }
  });
});
