import { z } from "zod";
import { ClaimValue, EntityChip, EvidenceSummary, IsoDate } from "../common.js";

// POST /compare {slugs[]}

export const CompareBody = z.object({
  slugs: z.array(z.string()).min(2).max(4),
  as_of: IsoDate.optional(),
});
export type CompareBody = z.infer<typeof CompareBody>;

export const CompareCellValue = z.object({
  claim_id: z.uuid(),
  qualifier: z.string().nullable(),
  value: ClaimValue,
  evidence_summary: EvidenceSummary,
});

/** null when the column has no value for the row. */
export const CompareCell = z.object({ values: z.array(CompareCellValue) }).nullable();

export const CompareRow = z.object({
  predicate: z.string(),
  label: z.string(),
  cells: z.array(CompareCell),
});

export const CompareGroup = z.object({
  /** A canonical stack layer, SAFETY, or an attribute family (PHYSICAL, PERFORMANCE, COMMERCIAL, IDENTITY). */
  group: z.string(),
  label: z.string(),
  rows: z.array(CompareRow),
});

export const CompareResponse = z.object({
  columns: z.array(EntityChip),
  /** Rows present only where at least two columns have values. */
  groups: z.array(CompareGroup),
  as_of: IsoDate.nullable(),
});
export type CompareResponse = z.infer<typeof CompareResponse>;
