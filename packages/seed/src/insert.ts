import { sql } from "drizzle-orm";
import {
  assessments,
  changeEvents,
  claimDependencies,
  claims,
  embodimentLayerLabels,
  entities,
  entityAliases,
  evidence,
  places,
  approveClaim,
  recomputeCachedColumns,
  sources,
  reviewActions,
  type Db,
} from "@ri/db";
import { SEED_OBSERVED_AT, type SeedRows } from "./build.js";
import { changeEventId, deterministicId } from "./ids.js";

const CHUNK = 500;

async function insertAll<T>(insert: (rows: T[]) => Promise<unknown>, rows: T[]) {
  for (let i = 0; i < rows.length; i += CHUNK) await insert(rows.slice(i, i + CHUNK));
}

/** Replaces all seed-managed tables in one transaction, then recomputes cached columns. */
export async function insertRows(db: Db, rows: SeedRows): Promise<void> {
  const approved = rows.claims.filter((claim) => claim.status === "APPROVED");
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`TRUNCATE review_actions, change_events, assessments, evidence, claim_dependencies, claims, sources, places, entity_aliases, entities, embodiment_layer_labels CASCADE`,
    );
    await insertAll((r) => tx.insert(entities).values(r), rows.entities);
    await insertAll((r) => tx.insert(entityAliases).values(r), rows.aliases);
    await insertAll((r) => tx.insert(places).values(r), rows.places);
    await insertAll((r) => tx.insert(sources).values(r), rows.sources);
    await insertAll((r) => tx.insert(claims).values(r), rows.claims.map((claim) => claim.status === "APPROVED" ? { ...claim, status: "PROPOSED" as const } : claim));
    await insertAll((r) => tx.insert(claimDependencies).values(r), rows.dependencies);
    await insertAll((r) => tx.insert(evidence).values(r), rows.evidence);
    await insertAll((r) => tx.insert(assessments).values(r), rows.assessments);
    await insertAll((r) => tx.insert(embodimentLayerLabels).values(r), rows.layerLabels);
  });
  for (const claim of approved) {
    const actedAt = `${claim.validFrom}T00:00:00.000Z`;
    await approveClaim(db, { claimId: claim.id, reviewer: "seed", reason: "approved seed claim", actedAt, eventId: changeEventId(claim.id), reviewActionId: deterministicId("review-action", claim.id), skipRecompute: true, origin: "SEED" });
  }
  await recomputeCachedColumns(db, `${SEED_OBSERVED_AT}T00:00:00.000Z`);
}
