import { z } from "zod";
import { CommercialStage, Embodiment, EntityType, Maturity } from "@ri/domain";

/** Structured filters shared by discovery endpoints. */
export const DiscoveryFilters = z.object({
  entity_type: EntityType.optional(),
  embodiment: Embodiment.optional(),
  commercial_stage: CommercialStage.optional(),
  maturity: Maturity.optional(),
  country_code: z.string().length(2).transform((value) => value.toUpperCase()).optional(),
});
export type DiscoveryFilters = z.infer<typeof DiscoveryFilters>;
