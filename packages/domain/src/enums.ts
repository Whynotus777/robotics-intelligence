import { z } from "zod";

// Every enum in the contract lives here, as a const tuple plus a Zod schema.
// The database enums in @ri/db are generated from these tuples.

export const ENTITY_TYPES = [
  "ORGANIZATION",
  "ROBOT",
  "ROBOT_FAMILY",
  "COMPONENT_PRODUCT",
  "SOFTWARE_PRODUCT",
  "MODEL",
  "TECHNOLOGY",
  "MARKET",
  "TASK",
  "APPROACH",
  "DEPLOYMENT",
  "PLACE",
  "BENCHMARK",
  "PAPER",
  "DATASET",
] as const;
export const EntityType = z.enum(ENTITY_TYPES);
export type EntityType = z.infer<typeof EntityType>;

export const EMBODIMENTS = [
  "HUMANOID",
  "INDUSTRIAL_ARM",
  "COBOT",
  "AMR",
  "DRONE",
  "QUADRUPED",
  "AUTONOMOUS_VEHICLE",
  "OTHER_MOBILE",
] as const;
export const Embodiment = z.enum(EMBODIMENTS);
export type Embodiment = z.infer<typeof Embodiment>;

export const DEPTH_TIERS = ["ANCHOR", "STANDARD", "DISCOVERY"] as const;
export const DepthTier = z.enum(DEPTH_TIERS);
export type DepthTier = z.infer<typeof DepthTier>;

// Task / market maturity. Never merged with commercial stage.
export const MATURITIES = ["RESEARCH", "PILOT", "EARLY_COMMERCIAL", "SCALING", "MATURE"] as const;
export const Maturity = z.enum(MATURITIES);
export type Maturity = z.infer<typeof Maturity>;

// Robot commercial stage. Never merged with maturity.
export const COMMERCIAL_STAGES = [
  "CONCEPT",
  "PROTOTYPE",
  "PILOT_DEPLOYMENTS",
  "COMMERCIAL",
  "VOLUME_PRODUCTION",
] as const;
export const CommercialStage = z.enum(COMMERCIAL_STAGES);
export type CommercialStage = z.infer<typeof CommercialStage>;

export const DEPLOYMENT_KINDS = ["FIELD_TRIAL", "PILOT", "COMMERCIAL"] as const;
export const DeploymentKind = z.enum(DEPLOYMENT_KINDS);
export type DeploymentKind = z.infer<typeof DeploymentKind>;

// Eleven canonical stack layers in top-to-bottom order, plus SAFETY (cross-cutting).
export const CANONICAL_LAYERS = [
  "INTELLIGENCE",
  "PLANNING",
  "PERCEPTION",
  "STATE_ESTIMATION",
  "CONTROL",
  "COMPUTE",
  "SENSORS",
  "ACTUATION",
  "END_EFFECTOR_PAYLOAD",
  "POWER",
  "MECHANICAL",
] as const;
export const STACK_LAYERS = [...CANONICAL_LAYERS, "SAFETY"] as const;
export const StackLayer = z.enum(STACK_LAYERS);
export type StackLayer = z.infer<typeof StackLayer>;
export type CanonicalLayer = (typeof CANONICAL_LAYERS)[number];

export const EVIDENCE_CLASSES = ["PRIMARY", "THIRD_PARTY", "ACADEMIC", "DERIVED", "ANALYST"] as const;
export const EvidenceClass = z.enum(EVIDENCE_CLASSES);
export type EvidenceClass = z.infer<typeof EvidenceClass>;

// Reported by the API only; never stored.
export const EVIDENCE_CLASS_OR_NA = [...EVIDENCE_CLASSES, "NOT_AVAILABLE"] as const;
export const EvidenceClassOrNotAvailable = z.enum(EVIDENCE_CLASS_OR_NA);

export const CONFIDENCES = ["HIGH", "MEDIUM", "LOW"] as const;
export const Confidence = z.enum(CONFIDENCES);
export type Confidence = z.infer<typeof Confidence>;

export const EVIDENCE_STANCES = ["SUPPORTS", "CONFLICTS"] as const;
export const EvidenceStance = z.enum(EVIDENCE_STANCES);
export type EvidenceStance = z.infer<typeof EvidenceStance>;

export const CLAIM_STATUSES = ["PROPOSED", "APPROVED", "REJECTED", "SUPERSEDED"] as const;
export const ClaimStatus = z.enum(CLAIM_STATUSES);
export type ClaimStatus = z.infer<typeof ClaimStatus>;

/** How a candidate entered the claim table. PROPOSED claims never have a parallel store. */
export const CLAIM_ORIGINS = ["MANUAL", "EXTRACTED", "DERIVED"] as const;
export const ClaimOrigin = z.enum(CLAIM_ORIGINS);
export type ClaimOrigin = z.infer<typeof ClaimOrigin>;

export const LICENSE_POLICIES = ["VERBATIM_OK", "SUMMARY_ONLY", "LINK_ONLY"] as const;
export const LicensePolicy = z.enum(LICENSE_POLICIES);
export type LicensePolicy = z.infer<typeof LicensePolicy>;

export const EXTRACTION_STATUSES = ["PENDING", "EXTRACTED", "UNCHANGED", "FAILED"] as const;
export const ExtractionStatus = z.enum(EXTRACTION_STATUSES);
export type ExtractionStatus = z.infer<typeof ExtractionStatus>;

export const REFRESH_CADENCES = ["DAILY", "WEEKLY", "MONTHLY", "MANUAL", "NEVER"] as const;
export const RefreshCadence = z.enum(REFRESH_CADENCES);
export type RefreshCadence = z.infer<typeof RefreshCadence>;

export const REVIEW_ACTIONS = ["APPROVE", "EDIT", "REJECT"] as const;
export const ReviewAction = z.enum(REVIEW_ACTIONS);
export type ReviewAction = z.infer<typeof ReviewAction>;

export const SOURCE_KINDS = [
  "PRODUCT_PAGE",
  "DATASHEET",
  "PRESS_RELEASE",
  "FILING",
  "PAPER",
  "NEWS",
  "CASE_STUDY",
  "TALK",
  "OTHER",
] as const;
export const SourceKind = z.enum(SOURCE_KINDS);
export type SourceKind = z.infer<typeof SourceKind>;

export const CHANGE_EVENT_TYPES = [
  "ENTITY_CREATED",
  "PRODUCT_LAUNCHED",
  "DEPLOYMENT_ADDED",
  "CLAIM_CHANGED",
  "COMMERCIAL_STAGE_CHANGED",
  "MATURITY_CHANGED",
  "PARTNERSHIP_ADDED",
  "BENCHMARK_RESULT_ADDED",
  "FUNDING_EVENT",
  "SOURCE_ADDED",
] as const;
export const ChangeEventType = z.enum(CHANGE_EVENT_TYPES);
export type ChangeEventType = z.infer<typeof ChangeEventType>;

// Canonical units for numeric claims. Conversions happen at ingest.
export const UNITS = ["m", "kg", "N·m", "W", "Wh", "s", "USD", "count", "units", "m/s", "score"] as const;
export const Unit = z.enum(UNITS);
export type Unit = z.infer<typeof Unit>;

export const VALUE_KINDS = ["TEXT", "NUMBER", "ENUM", "ENTITY", "DATE"] as const;
export const ValueKind = z.enum(VALUE_KINDS);
export type ValueKind = z.infer<typeof ValueKind>;

export const CARDINALITIES = ["ONE", "MANY"] as const;
export const Cardinality = z.enum(CARDINALITIES);
export type Cardinality = z.infer<typeof Cardinality>;

// Names of enums a value_enum claim may draw from.
export const ENUM_NAMES = ["Maturity", "CommercialStage", "Embodiment", "DeploymentKind"] as const;
export const EnumName = z.enum(ENUM_NAMES);
export type EnumName = z.infer<typeof EnumName>;

export const ENUM_VALUES: Record<EnumName, readonly string[]> = {
  Maturity: MATURITIES,
  CommercialStage: COMMERCIAL_STAGES,
  Embodiment: EMBODIMENTS,
  DeploymentKind: DEPLOYMENT_KINDS,
};
