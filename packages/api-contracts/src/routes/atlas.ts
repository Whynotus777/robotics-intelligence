import { z } from "zod";
import { Embodiment } from "@ri/domain";
import { EntityChip, IsoDate } from "../common.js";

// GET /atlas?layer=&bbox=

/**
 * The Atlas answers "where does robotics actually happen", so its layers are the
 * kinds of activity a place hosts, not the predicates that record them: a factory
 * and a headquarters both put an OEM on the map under BUILT.
 */
export const ATLAS_LAYERS = ["BUILT", "SUPPLIED", "MANUFACTURED", "DEPLOYED", "TRAINED", "FUNDED", "PLATFORMS"] as const;
export const AtlasLayer = z.enum(ATLAS_LAYERS);
export type AtlasLayer = z.infer<typeof AtlasLayer>;

/** bbox as "minLng,minLat,maxLng,maxLat". */
export const AtlasQuery = z.object({
  layer: AtlasLayer.default("BUILT"),
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
  /** Distinct entities on this mark — what the mark is sized by. */
  weight: z.number().int().nonnegative(),
  entities: z.array(EntityChip),
  embodiment_mix: z.partialRecord(Embodiment, z.number().int().nonnegative()),
});

/** A layer and how much it has to show, so a switcher can grey out an empty one. */
export const AtlasLayerSummary = z.object({
  id: AtlasLayer,
  label: z.string(),
  count: z.number().int().nonnegative(),
});

export const AtlasRollup = z.object({
  id: z.string(),
  label: z.string(),
  weight: z.number().int().nonnegative(),
  places: z.number().int().nonnegative(),
});

export const AtlasResponse = z.object({
  layer: AtlasLayer,
  /** Every layer with its count, so the map can say what is empty before you click. */
  layers: z.array(AtlasLayerSummary),
  marks: z.array(AtlasMark),
  /** Zoomed-out views of the same marks. */
  countries: z.array(AtlasRollup),
  corridors: z.array(AtlasRollup),
  /** Mirrored list of the visible marks, one row per (entity, place). */
  list: z.array(z.object({ entity: EntityChip, place: EntityChip })),
  as_of: IsoDate.nullable(),
});
export type AtlasResponse = z.infer<typeof AtlasResponse>;
