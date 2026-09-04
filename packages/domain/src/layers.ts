import { z } from "zod";
import { CANONICAL_LAYERS, Embodiment, StackLayer } from "./enums.js";
import type { CanonicalLayer } from "./enums.js";

/** (embodiment, canonical layer) → display label and whether the layer applies. */
export const EmbodimentLayerLabel = z.object({
  embodiment: Embodiment,
  layer: StackLayer,
  label: z.string().min(1),
  applies: z.boolean(),
});
export type EmbodimentLayerLabel = z.infer<typeof EmbodimentLayerLabel>;

export function layerOrder(layer: string): number {
  const i = (CANONICAL_LAYERS as readonly string[]).indexOf(layer);
  return i === -1 ? CANONICAL_LAYERS.length : i;
}

export function isCanonicalLayer(layer: string): layer is CanonicalLayer {
  return (CANONICAL_LAYERS as readonly string[]).includes(layer);
}
