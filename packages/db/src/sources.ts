import { and, asc, desc, eq, isNotNull, lte, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { sourceSnapshots, sources, type Db } from "./index.js";

/** Sources ready for an ingestion worker, ordered by editorial priority then due time. */
export async function dueSources(db: Db, now: string) {
  return db
    .select()
    .from(sources)
    .where(and(isNotNull(sources.nextCheckAt), lte(sources.nextCheckAt, now), ne(sources.refreshCadence, "NEVER")))
    .orderBy(desc(sources.priority), asc(sources.nextCheckAt));
}

export function sourceContentChanged(previousHash: string | null, incomingHash: string): boolean {
  return previousHash !== incomingHash;
}

/** Records immutable fetch metadata and marks unchanged content so workers stop before extraction. */
export async function recordSourceSnapshot(
  db: Db,
  input: { sourceId: string; fetchedAt: string; contentHash: string; snapshotPointer: string },
): Promise<{ snapshotId: string; changed: boolean }> {
  const [source] = await db.select().from(sources).where(eq(sources.id, input.sourceId));
  if (!source) throw new Error(`source ${input.sourceId} not found`);
  const snapshotId = randomUUID();
  const changed = sourceContentChanged(source.contentHash, input.contentHash);
  await db.transaction(async (tx) => {
    await tx.insert(sourceSnapshots).values({ id: snapshotId, ...input });
    await tx.update(sources).set({
      fetchedAt: input.fetchedAt,
      contentHash: input.contentHash,
      latestSnapshotId: snapshotId,
      extractionStatus: changed ? "PENDING" : "UNCHANGED",
    }).where(eq(sources.id, input.sourceId));
  });
  return { snapshotId, changed };
}
