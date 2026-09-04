import { sql } from "drizzle-orm";
import type { Db } from "./client.js";

/**
 * Recomputes the cached current-value columns on entities from APPROVED open claims.
 * This is the only writer of those columns. Idempotent.
 */
export async function recomputeCachedColumns(db: Db): Promise<void> {
  await db.execute(sql`
    UPDATE entities e SET
      commercial_stage = v.commercial_stage::commercial_stage,
      height_m = v.height_m,
      mass_kg = v.mass_kg,
      payload_kg = v.payload_kg,
      list_price_usd = v.list_price_usd,
      maturity = v.maturity::maturity,
      updated_at = CASE WHEN
          e.commercial_stage IS DISTINCT FROM v.commercial_stage::commercial_stage
          OR e.height_m IS DISTINCT FROM v.height_m
          OR e.mass_kg IS DISTINCT FROM v.mass_kg
          OR e.payload_kg IS DISTINCT FROM v.payload_kg
          OR e.list_price_usd IS DISTINCT FROM v.list_price_usd
          OR e.maturity IS DISTINCT FROM v.maturity::maturity
        THEN now() ELSE e.updated_at END
    FROM (
      SELECT
        x.id,
        (SELECT c.value_enum FROM claims c WHERE c.subject_entity_id = x.id AND c.predicate = 'HAS_COMMERCIAL_STAGE' AND c.status = 'APPROVED' AND c.valid_to IS NULL ORDER BY c.valid_from DESC LIMIT 1) AS commercial_stage,
        (SELECT c.value_number FROM claims c WHERE c.subject_entity_id = x.id AND c.predicate = 'HAS_HEIGHT' AND c.status = 'APPROVED' AND c.valid_to IS NULL ORDER BY c.valid_from DESC LIMIT 1) AS height_m,
        (SELECT c.value_number FROM claims c WHERE c.subject_entity_id = x.id AND c.predicate = 'HAS_MASS' AND c.status = 'APPROVED' AND c.valid_to IS NULL ORDER BY c.valid_from DESC LIMIT 1) AS mass_kg,
        (SELECT c.value_number FROM claims c WHERE c.subject_entity_id = x.id AND c.predicate = 'HAS_PAYLOAD' AND c.status = 'APPROVED' AND c.valid_to IS NULL ORDER BY c.valid_from DESC LIMIT 1) AS payload_kg,
        (SELECT c.value_number FROM claims c WHERE c.subject_entity_id = x.id AND c.predicate = 'HAS_LIST_PRICE' AND c.status = 'APPROVED' AND c.valid_to IS NULL ORDER BY c.valid_from DESC LIMIT 1) AS list_price_usd,
        (SELECT c.value_enum FROM claims c WHERE c.subject_entity_id = x.id AND c.predicate = 'HAS_MATURITY' AND c.status = 'APPROVED' AND c.valid_to IS NULL ORDER BY c.valid_from DESC LIMIT 1) AS maturity
      FROM entities x
    ) v
    WHERE v.id = e.id
  `);
}

export interface CachedSnapshot {
  commercial_stage: string | null;
  height_m: number | null;
  mass_kg: number | null;
  payload_kg: number | null;
  list_price_usd: number | null;
  maturity: string | null;
}

/** Pure recompute for one entity, used by the invariant test to cross-check the SQL above. */
export function cachedFromClaims(
  rows: { predicate: string; value_enum: string | null; value_number: number | null; valid_from: string; status: string; valid_to: string | null }[],
): CachedSnapshot {
  const open = rows.filter((r) => r.status === "APPROVED" && r.valid_to === null);
  const latest = (predicate: string) =>
    open.filter((r) => r.predicate === predicate).sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1))[0] ?? null;
  return {
    commercial_stage: latest("HAS_COMMERCIAL_STAGE")?.value_enum ?? null,
    height_m: latest("HAS_HEIGHT")?.value_number ?? null,
    mass_kg: latest("HAS_MASS")?.value_number ?? null,
    payload_kg: latest("HAS_PAYLOAD")?.value_number ?? null,
    list_price_usd: latest("HAS_LIST_PRICE")?.value_number ?? null,
    maturity: latest("HAS_MATURITY")?.value_enum ?? null,
  };
}
