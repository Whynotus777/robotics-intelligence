import { z } from "zod";
import { CANONICAL_LAYERS } from "@ri/domain";
import { EntityChip } from "../common.js";
import { ExploreLens } from "./explore.js";

export const StackMatrixQuery = z.object({ lens: ExploreLens.default("embodiment") });
export const StackMatrixCell = z.object({ chip: EntityChip, robot_count: z.number().int().nonnegative() });
export const StackMatrixResponse = z.object({
  lens: ExploreLens,
  columns: z.array(z.object({ id: z.string(), label: z.string() })),
  rows: z.array(z.object({ layer: z.enum(CANONICAL_LAYERS), cells: z.array(StackMatrixCell) })),
});
export type StackMatrixResponse = z.infer<typeof StackMatrixResponse>;
