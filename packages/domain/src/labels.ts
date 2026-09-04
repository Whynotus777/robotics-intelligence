import type { CanonicalLayer, CommercialStage, Embodiment, Maturity, StackLayer } from "./enums.js";

/**
 * Display labels for the enums that reach a screen. Enum identifiers are storage,
 * never presentation: every route that puts an enum in a `label` field resolves it
 * here first, so a raw `HUMANOID` or `EARLY_COMMERCIAL` can never be rendered.
 */

/** Embodiment as a region name — the plural, grouped form Explore partitions by. */
export const EMBODIMENT_GROUP_LABEL: Record<Embodiment, string> = {
  HUMANOID: "Humanoids",
  INDUSTRIAL_ARM: "Industrial arms",
  COBOT: "Cobots",
  AMR: "AMRs & warehouse",
  DRONE: "Drones",
  QUADRUPED: "Quadrupeds & legged",
  AUTONOMOUS_VEHICLE: "Autonomous vehicles",
  OTHER_MOBILE: "Field & specialized robots",
};

/** Embodiment as a single robot's kind. */
export const EMBODIMENT_LABEL: Record<Embodiment, string> = {
  HUMANOID: "Humanoid",
  INDUSTRIAL_ARM: "Industrial arm",
  COBOT: "Cobot",
  AMR: "AMR",
  DRONE: "Drone",
  QUADRUPED: "Quadruped",
  AUTONOMOUS_VEHICLE: "Autonomous vehicle",
  OTHER_MOBILE: "Field & specialized",
};

export const MATURITY_LABEL: Record<Maturity, string> = {
  RESEARCH: "Research",
  PILOT: "Pilot",
  EARLY_COMMERCIAL: "Early commercial",
  SCALING: "Scaling",
  MATURE: "Mature",
};

export const COMMERCIAL_STAGE_LABEL: Record<CommercialStage, string> = {
  CONCEPT: "Concept",
  PROTOTYPE: "Prototype",
  PILOT_DEPLOYMENTS: "Pilot deployments",
  COMMERCIAL: "Commercial",
  VOLUME_PRODUCTION: "Volume production",
};

export const STACK_LAYER_LABEL: Record<StackLayer, string> = {
  INTELLIGENCE: "Intelligence",
  PLANNING: "Planning",
  PERCEPTION: "Perception",
  STATE_ESTIMATION: "State estimation",
  CONTROL: "Control",
  COMPUTE: "Compute",
  SENSORS: "Sensors",
  ACTUATION: "Actuation",
  END_EFFECTOR_PAYLOAD: "End effector / payload",
  POWER: "Power",
  MECHANICAL: "Mechanical",
  SAFETY: "Safety",
};

export function canonicalLayerLabel(layer: CanonicalLayer): string {
  return STACK_LAYER_LABEL[layer];
}
