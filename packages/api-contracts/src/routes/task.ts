import { z } from "zod";
import { DeploymentKind, Embodiment, Maturity } from "@ri/domain";
import { AsOfQuery, AssessmentView, EntityChip, EvidenceSummary, IntelligenceRailSummary, IsoDate, TextItem } from "../common.js";

// GET /tasks/:slug

export const TaskParams = z.object({ slug: z.string() });
export const TaskQuery = AsOfQuery;

export const MaturityView = z.object({
  value: Maturity,
  claim_id: z.uuid(),
  qualifier: z.string().nullable(),
  evidence_summary: EvidenceSummary,
  assessment: AssessmentView.nullable(),
});

export const ApproachView = z.object({
  approach: EntityChip,
  short_description: z.string().nullable(),
  maturity: MaturityView.optional(),
  embodiments: z.array(Embodiment),
  example_vendors: z.array(EntityChip),
});

export const DeploymentView = z.object({
  deployment: EntityChip,
  customer: EntityChip.nullable(),
  operators: z.array(EntityChip),
  robots: z.array(EntityChip),
  places: z.array(EntityChip),
  began: IsoDate.nullable(),
  deployment_kind: DeploymentKind.nullable(),
  evidence_summary: EvidenceSummary,
});

/** Sections are optional and omitted when empty. */
export const TaskResponse = z.object({
  task: EntityChip,
  short_description: z.string().nullable(),
  /** Sector → domain chips, root first. */
  market_path: z.array(EntityChip),
  maturity: MaturityView.optional(),
  incumbent_process: z.array(TextItem).optional(),
  approaches: z.array(ApproachView).optional(),
  required_technologies: z.array(EntityChip).optional(),
  technical_requirements: z.array(TextItem).optional(),
  vendors: z.array(z.object({ organization: EntityChip, via: z.enum(["TARGETS_TASK", "DEPLOYMENT"]), hq_place_label: z.string().nullable() })).optional(),
  robots: z.array(EntityChip).optional(),
  deployments: z.array(DeploymentView).optional(),
  customer_types: z.array(TextItem).optional(),
  blockers: z.array(TextItem).optional(),
  adjacent_tasks: z.array(EntityChip).optional(),
  economics_notes: z.array(TextItem).optional(),
  intelligence_rail: IntelligenceRailSummary,
  as_of: IsoDate.nullable(),
});
export type TaskResponse = z.infer<typeof TaskResponse>;
