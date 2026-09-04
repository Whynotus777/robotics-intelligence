import type { ClaimValue, EntityChip } from "@ri/api-contracts";
import type { CommercialStage, Embodiment, EntityType, Maturity } from "@ri/domain";
import { COMMERCIAL_STAGES, MATURITIES } from "@ri/domain";

/**
 * The fixed vocabulary of section 2 of the design prompt, in one place.
 * Two labelling systems reach the UI: one evidence chip and one maturity scale.
 * Commercial stage is a third, separate question and never shares their treatment.
 */

export const EMBODIMENT_LABEL: Record<Embodiment, string> = {
  HUMANOID: "Humanoid",
  INDUSTRIAL_ARM: "Industrial arm",
  COBOT: "Cobot",
  AMR: "AMR",
  DRONE: "Drone",
  QUADRUPED: "Quadruped",
  AUTONOMOUS_VEHICLE: "Autonomous vehicle",
  OTHER_MOBILE: "Other mobile",
};

/** Region names as the Explore lens groups them. */
export const EMBODIMENT_GROUP: Record<Embodiment, string> = {
  HUMANOID: "Humanoids",
  INDUSTRIAL_ARM: "Industrial arms & cobots",
  COBOT: "Industrial arms & cobots",
  AMR: "AMRs & warehouse",
  DRONE: "Drones",
  QUADRUPED: "Quadrupeds & legged",
  AUTONOMOUS_VEHICLE: "Autonomous vehicles",
  OTHER_MOBILE: "Other mobile",
};

/** Categorical colour is reserved for embodiment and used the same way everywhere. */
export const EMBODIMENT_COLOR: Record<Embodiment, string> = {
  HUMANOID: "var(--color-humanoid)",
  INDUSTRIAL_ARM: "var(--color-industrial-arm)",
  COBOT: "var(--color-cobot)",
  AMR: "var(--color-amr)",
  DRONE: "var(--color-drone)",
  QUADRUPED: "var(--color-quadruped)",
  AUTONOMOUS_VEHICLE: "var(--color-autonomous-vehicle)",
  OTHER_MOBILE: "var(--color-component)",
};

export const EMBODIMENT_ORDER: Embodiment[] = [
  "HUMANOID",
  "QUADRUPED",
  "AMR",
  "DRONE",
  "COBOT",
  "INDUSTRIAL_ARM",
  "AUTONOMOUS_VEHICLE",
  "OTHER_MOBILE",
];

export function embodimentColor(embodiment: Embodiment | null | undefined): string {
  return embodiment ? EMBODIMENT_COLOR[embodiment] : "var(--color-ink-3)";
}

export const MATURITY_LABEL: Record<Maturity, string> = {
  RESEARCH: "Research",
  PILOT: "Pilot",
  EARLY_COMMERCIAL: "Early commercial",
  SCALING: "Scaling",
  MATURE: "Mature",
};

export function maturityStep(maturity: Maturity): number {
  return MATURITIES.indexOf(maturity) + 1;
}

/** The next rung of the ladder, for the drawer's "what would move it" heading. */
export function nextMaturity(maturity: Maturity): Maturity | null {
  const next = MATURITIES[MATURITIES.indexOf(maturity) + 1];
  return next ?? null;
}

export const COMMERCIAL_STAGE_LABEL: Record<CommercialStage, string> = {
  CONCEPT: "Concept",
  PROTOTYPE: "Prototype",
  PILOT_DEPLOYMENTS: "Pilot deployments",
  COMMERCIAL: "Commercial",
  VOLUME_PRODUCTION: "Volume production",
};

export function commercialStageStep(stage: CommercialStage): number {
  return COMMERCIAL_STAGES.indexOf(stage) + 1;
}

export const EVIDENCE_CLASS_LABEL: Record<string, string> = {
  PRIMARY: "PRIMARY",
  THIRD_PARTY: "THIRD-PARTY",
  ACADEMIC: "ACADEMIC",
  DERIVED: "DERIVED",
  ANALYST: "ANALYST",
  NOT_AVAILABLE: "NOT AVAILABLE",
};

export const CONFIDENCE_LABEL: Record<string, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const SOURCE_KIND_LABEL: Record<string, string> = {
  PRODUCT_PAGE: "product page",
  DATASHEET: "datasheet",
  PRESS_RELEASE: "press release",
  FILING: "filing",
  PAPER: "paper",
  NEWS: "news",
  CASE_STUDY: "case study",
  TALK: "talk",
  OTHER: "source",
};

export const CHANGE_EVENT_LABEL: Record<string, string> = {
  ENTITY_CREATED: "Entity added",
  PRODUCT_LAUNCHED: "Product launched",
  DEPLOYMENT_ADDED: "Deployment added",
  CLAIM_CHANGED: "Claim changed",
  COMMERCIAL_STAGE_CHANGED: "Commercial stage changed",
  MATURITY_CHANGED: "Maturity changed",
  PARTNERSHIP_ADDED: "Partnership added",
  BENCHMARK_RESULT_ADDED: "Benchmark result added",
  FUNDING_EVENT: "Funding",
  SOURCE_ADDED: "Source added",
};

export const STACK_LAYER_LABEL: Record<string, string> = {
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

/** Entity chip glyph: ■ robot · ○ company · ◇ technology · ● product · ⬡ market/task. */
export type ChipGlyph = "square" | "ring" | "diamond" | "dot" | "hex";

export function glyphFor(entityType: EntityType): ChipGlyph {
  switch (entityType) {
    case "ROBOT":
    case "ROBOT_FAMILY":
      return "square";
    case "ORGANIZATION":
      return "ring";
    case "TECHNOLOGY":
    case "APPROACH":
      return "diamond";
    case "COMPONENT_PRODUCT":
    case "SOFTWARE_PRODUCT":
    case "MODEL":
      return "dot";
    default:
      return "hex";
  }
}

const ENTITY_ROUTE: Partial<Record<EntityType, string>> = {
  ROBOT: "/r",
  MARKET: "/m",
  TASK: "/t",
};

/** Every entity chip is clickable; types without their own screen land on the entity route. */
export function hrefFor(chip: Pick<EntityChip, "slug" | "entity_type">): string {
  const prefix = ENTITY_ROUTE[chip.entity_type] ?? "/e";
  return `${prefix}/${chip.slug}`;
}

const NUMBER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** A claim value as the compact string the specs grid and comparison cells print. */
export function formatValue(value: ClaimValue): string {
  switch (value.kind) {
    case "text":
      return value.text;
    case "enum":
      return (
        MATURITY_LABEL[value.value as Maturity] ??
        COMMERCIAL_STAGE_LABEL[value.value as CommercialStage] ??
        EMBODIMENT_LABEL[value.value as Embodiment] ??
        value.value
      );
    case "date":
      return formatDate(value.date);
    case "entity":
      return value.measure
        ? `${value.entity.name} · ${NUMBER.format(value.measure.number)} ${value.measure.unit}`
        : value.entity.name;
    case "number": {
      const approx = value.is_approximate ? "~" : "";
      if (value.unit === "USD") return `${approx}${USD.format(value.number)}`;
      if (value.unit === "count" || value.unit === "units") return `${approx}${NUMBER.format(value.number)}`;
      if (value.unit === "s") return `${approx}${formatDuration(value.number)}`;
      return `${approx}${NUMBER.format(value.number)} ${value.unit}`;
    }
  }
}

function formatDuration(seconds: number): string {
  if (seconds >= 3600) return `${NUMBER.format(seconds / 3600)} h`;
  if (seconds >= 60) return `${NUMBER.format(seconds / 60)} min`;
  return `${NUMBER.format(seconds)} s`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatMonth(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Predicate labels arrive from the contract; this only fixes the sentence case. */
export function sentenceCase(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Which stack layer a scalar spec belongs to. The claim carries the layer when
 * the predicate requires one; these are the presentation defaults for the
 * dimensional specs, so the grid can be grouped by layer as designed.
 */
export const SPEC_LAYER: Record<string, string> = {
  HAS_HEIGHT: "MECHANICAL",
  HAS_MASS: "MECHANICAL",
  HAS_DOF: "MECHANICAL",
  HAS_REACH: "MECHANICAL",
  HAS_PAYLOAD: "END_EFFECTOR_PAYLOAD",
  HAS_RUNTIME: "POWER",
};

/** Stack membership is answered by the MRI; a robot profile does not list it twice. */
export const STACK_MEMBERSHIP_PREDICATES = new Set(["USES_PRODUCT", "USES_TECHNOLOGY"]);

/** Predicates the identity block already answers, so no section repeats them. */
export const IDENTITY_PREDICATES = new Set(["HAS_EMBODIMENT", "HAS_COMMERCIAL_STAGE", "HAS_LIST_PRICE"]);

/** Where a relationship group belongs on a profile. */
export type ProfileSection = "markets" | "deployments" | "makers" | "compare" | "related";

const RELATIONSHIP_SECTION: Record<string, ProfileSection> = {
  TARGETS_MARKET: "markets",
  TARGETS_TASK: "markets",
  BELONGS_TO_MARKET: "markets",
  SERVES_TASK: "markets",
  USES_ROBOT: "deployments",
  DEPLOYED_BY: "deployments",
  OPERATED_BY: "deployments",
  OCCURS_AT: "deployments",
  BUILDS: "makers",
  DEVELOPS: "makers",
  PROVIDES: "makers",
  MADE_BY: "makers",
  COMPETES_WITH: "compare",
};

export function sectionFor(predicate: string): ProfileSection {
  return RELATIONSHIP_SECTION[predicate] ?? "related";
}
