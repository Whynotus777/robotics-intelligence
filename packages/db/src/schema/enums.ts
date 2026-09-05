import { pgEnum } from "drizzle-orm/pg-core";
import {
  CHANGE_EVENT_ORIGINS,
  CHANGE_EVENT_TYPES,
  CLAIM_STATUSES,
  CLAIM_ORIGINS,
  CONFIDENCES,
  DEPTH_TIERS,
  EMBODIMENTS,
  ENTITY_TYPES,
  EVIDENCE_CLASSES,
  EVIDENCE_STANCES,
  COMMERCIAL_STAGES,
  MATURITIES,
  SOURCE_KINDS,
  LICENSE_POLICIES,
  EXTRACTION_STATUSES,
  REFRESH_CADENCES,
  REVIEW_ACTIONS,
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
export const claimOriginEnum = pgEnum("claim_origin", CLAIM_ORIGINS);
export const sourceKindEnum = pgEnum("source_kind", SOURCE_KINDS);
export const licensePolicyEnum = pgEnum("license_policy", LICENSE_POLICIES);
export const extractionStatusEnum = pgEnum("extraction_status", EXTRACTION_STATUSES);
export const refreshCadenceEnum = pgEnum("refresh_cadence", REFRESH_CADENCES);
export const reviewActionEnum = pgEnum("review_action", REVIEW_ACTIONS);
export const changeEventTypeEnum = pgEnum("change_event_type", CHANGE_EVENT_TYPES);
export const changeEventOriginEnum = pgEnum("change_event_origin", CHANGE_EVENT_ORIGINS);
