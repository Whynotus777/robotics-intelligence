import { z } from "zod";
import { CANONICAL_LAYERS } from "@ri/domain";
import { EntityChip } from "../common.js";
import { ExploreLens } from "./explore.js";

export const StackMatrixQuery = z.object({ lens: ExploreLens.default("embodiment") });
/** `column_id` matches a `columns[].id`: without it a cell cannot be placed in the matrix. */
export const StackMatrixCell = z.object({
  column_id: z.string(),
  chip: EntityChip,
  robot_count: z.number().int().nonnegative(),
});
export const StackMatrixResponse = z.object({
  lens: ExploreLens,
  /** `label` is always display text; enum identifiers never appear here. */
  columns: z.array(z.object({ id: z.string(), label: z.string() })),
  rows: z.array(z.object({ layer: z.enum(CANONICAL_LAYERS), cells: z.array(StackMatrixCell) })),
});
export type StackMatrixResponse = z.infer<typeof StackMatrixResponse>;
