import { z } from "zod";
import { Embodiment } from "@ri/domain";
import { EntityChip, IsoDate } from "../common.js";

// GET /atlas?layer=&bbox=

export const ATLAS_LAYERS = ["hq", "rnd", "manufacturing", "deployments", "research"] as const;
export const AtlasLayer = z.enum(ATLAS_LAYERS);
export type AtlasLayer = z.infer<typeof AtlasLayer>;

/** bbox as "minLng,minLat,maxLng,maxLat". */
export const AtlasQuery = z.object({
  layer: AtlasLayer.default("hq"),
  bbox: z
    .string()
    .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
    .optional(),
  as_of: IsoDate.optional(),
});
export type AtlasQuery = z.infer<typeof AtlasQuery>;

export const AtlasMark = z.object({
  place: EntityChip,
  lat: z.number(),
  lng: z.number(),
  country_code: z.string().nullable(),
  cluster_label: z.string().nullable(),
  entities: z.array(EntityChip),
  embodiment_mix: z.partialRecord(Embodiment, z.number().int().nonnegative()),
});

export const AtlasResponse = z.object({
  layer: AtlasLayer,
  marks: z.array(AtlasMark),
  /** Mirrored list of the visible marks, one row per (entity, place). */
  list: z.array(z.object({ entity: EntityChip, place: EntityChip })),
  as_of: IsoDate.nullable(),
});
export type AtlasResponse = z.infer<typeof AtlasResponse>;
