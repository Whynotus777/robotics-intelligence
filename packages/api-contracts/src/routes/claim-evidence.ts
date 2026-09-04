import { z } from "zod";
import { ClaimStatus, StackLayer } from "@ri/domain";
import { ClaimRef, ClaimValue, EntityChip, EvidenceView, IsoDate } from "../common.js";

// GET /claims/:id/evidence — the Evidence Drawer payload.

export const ClaimEvidenceParams = z.object({ id: z.uuid() });

export const CORROBORATION = ["NOT_AVAILABLE", "SINGLE", "CORROBORATED", "CONFLICTING"] as const;

export const ClaimEvidenceResponse = z.object({
  claim: z.object({
    claim_id: z.uuid(),
    subject: EntityChip,
    predicate: z.string(),
    label: z.string(),
    /** The claim as a plain sentence, e.g. "Unitree G1 list price is ~USD 16,000". */
    sentence: z.string(),
    value: ClaimValue,
    stack_layer: StackLayer.nullable(),
    status: ClaimStatus,
    valid_from: IsoDate,
    valid_to: IsoDate.nullable(),
    observed_at: z.iso.datetime(),
    last_verified_at: z.iso.datetime(),
  }),
  has_evidence: z.boolean(),
  corroboration: z.enum(CORROBORATION),
  evidence: z.array(EvidenceView),
  /** Previous claims for the same subject + predicate (and stack layer), newest first. */
  history: z.array(
    z.object({
      claim_id: z.uuid(),
      value: ClaimValue,
      status: ClaimStatus,
      valid_from: IsoDate,
      valid_to: IsoDate.nullable(),
    }),
  ),
  /** Inputs of a DERIVED claim. */
  dependencies: z.array(ClaimRef),
});
export type ClaimEvidenceResponse = z.infer<typeof ClaimEvidenceResponse>;
