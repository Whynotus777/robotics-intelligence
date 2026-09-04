import { and, eq, gt, inArray, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { claims } from "./schema/claims.js";

/**
 * The single public-visibility rule for claims.
 * - No as_of: APPROVED claims with valid_to IS NULL.
 * - With as_of: claims that were in force on that date (APPROVED or since SUPERSEDED).
 * PROPOSED and REJECTED claims are never visible.
 */
export function visibleClaims(asOf: string | null): SQL {
  if (asOf === null) {
    return and(eq(claims.status, "APPROVED"), isNull(claims.validTo))!;
  }
  return and(
    inArray(claims.status, ["APPROVED", "SUPERSEDED"]),
    lte(claims.validFrom, asOf),
    or(isNull(claims.validTo), gt(claims.validTo, asOf)),
  )!;
}

/** Same rule as raw SQL for hand-written queries. `c` is the claims alias. */
export function visibleClaimsSql(asOf: string | null, c = "c"): SQL {
  const col = sql.raw(c);
  if (asOf === null) return sql`${col}.status = 'APPROVED' AND ${col}.valid_to IS NULL`;
  return sql`${col}.status IN ('APPROVED','SUPERSEDED') AND ${col}.valid_from <= ${asOf}::date AND (${col}.valid_to IS NULL OR ${col}.valid_to > ${asOf}::date)`;
}
