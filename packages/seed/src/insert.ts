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
  recomputeCachedColumns,
  sources,
  type Db,
} from "@ri/db";
import { SEED_OBSERVED_AT, type SeedRows } from "./build.js";

const CHUNK = 500;

async function insertAll<T>(insert: (rows: T[]) => Promise<unknown>, rows: T[]) {
  for (let i = 0; i < rows.length; i += CHUNK) await insert(rows.slice(i, i + CHUNK));
}

/** Replaces all seed-managed tables in one transaction, then recomputes cached columns. */
export async function insertRows(db: Db, rows: SeedRows): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`TRUNCATE change_events, assessments, evidence, claim_dependencies, claims, sources, places, entity_aliases, entities, embodiment_layer_labels CASCADE`,
    );
    await insertAll((r) => tx.insert(entities).values(r), rows.entities);
    await insertAll((r) => tx.insert(entityAliases).values(r), rows.aliases);
    await insertAll((r) => tx.insert(places).values(r), rows.places);
    await insertAll((r) => tx.insert(sources).values(r), rows.sources);
    await insertAll((r) => tx.insert(claims).values(r), rows.claims);
    await insertAll((r) => tx.insert(claimDependencies).values(r), rows.dependencies);
    await insertAll((r) => tx.insert(evidence).values(r), rows.evidence);
    await insertAll((r) => tx.insert(assessments).values(r), rows.assessments);
    await insertAll((r) => tx.insert(embodimentLayerLabels).values(r), rows.layerLabels);
  });
  await recomputeCachedColumns(db, `${SEED_OBSERVED_AT}T00:00:00.000Z`);
}
