import { pgEnum } from "drizzle-orm/pg-core";
import {
  CHANGE_EVENT_TYPES,
  CLAIM_STATUSES,
  CONFIDENCES,
  DEPTH_TIERS,
  EMBODIMENTS,
  ENTITY_TYPES,
  EVIDENCE_CLASSES,
  EVIDENCE_STANCES,
  COMMERCIAL_STAGES,
  MATURITIES,
  SOURCE_KINDS,
  STACK_LAYERS,
} from "@ri/domain";

// Postgres enums are generated from the domain tuples so the two can never drift.
export const entityTypeEnum = pgEnum("entity_type", ENTITY_TYPES);
export const embodimentEnum = pgEnum("embodiment", EMBODIMENTS);
export const depthTierEnum = pgEnum("depth_tier", DEPTH_TIERS);
export const maturityEnum = pgEnum("maturity", MATURITIES);
export const commercialStageEnum = pgEnum("commercial_stage", COMMERCIAL_STAGES);
export const stackLayerEnum = pgEnum("stack_layer", STACK_LAYERS);
export const evidenceClassEnum = pgEnum("evidence_class", EVIDENCE_CLASSES);
export const confidenceEnum = pgEnum("confidence", CONFIDENCES);
export const evidenceStanceEnum = pgEnum("evidence_stance", EVIDENCE_STANCES);
export const claimStatusEnum = pgEnum("claim_status", CLAIM_STATUSES);
export const sourceKindEnum = pgEnum("source_kind", SOURCE_KINDS);
export const changeEventTypeEnum = pgEnum("change_event_type", CHANGE_EVENT_TYPES);
