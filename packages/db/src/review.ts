import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { PREDICATES, validateClaimShape } from "@ri/domain";
import type { Db } from "./client.js";
import { changeEvents } from "./schema/change-events.js";
import { claims } from "./schema/claims.js";
import { entities } from "./schema/entities.js";
import { evidence } from "./schema/evidence.js";
import { assessments } from "./schema/evidence.js";
import { claimDependencies } from "./schema/claims.js";
import { reviewActions } from "./schema/review-actions.js";
import { recomputeCachedColumns } from "./recompute.js";
import { eventSummary, eventTypeForClaim } from "./events.js";

type ClaimInsert = typeof claims.$inferInsert;
type ClaimPatch = Partial<Omit<ClaimInsert, "id" | "subjectEntityId" | "status" | "origin" | "createdAt" | "updatedAt">>;

export interface ReviewDecision {
  claimId: string;
  reviewer: string;
  reason?: string;
  actedAt?: string;
  eventId?: string;
  reviewActionId?: string;
  skipRecompute?: boolean;
}

async function validateCandidate(db: Db, candidate: typeof claims.$inferSelect) {
  const [subject, object] = await Promise.all([
    db.select().from(entities).where(eq(entities.id, candidate.subjectEntityId)),
    candidate.objectEntityId ? db.select().from(entities).where(eq(entities.id, candidate.objectEntityId)) : Promise.resolve([]),
  ]);
  if (!subject[0]) throw new Error(`candidate ${candidate.id} has no subject`);
  const problems = validateClaimShape({
    predicate: candidate.predicate, value_text: candidate.valueText, value_number: candidate.valueNumber, unit: candidate.unit as never,
    is_approximate: candidate.isApproximate, value_min: candidate.valueMin, value_max: candidate.valueMax, value_enum: candidate.valueEnum,
    object_entity_id: candidate.objectEntityId, value_date: candidate.valueDate, stack_layer: candidate.stackLayer,
    valid_from: candidate.validFrom, valid_to: candidate.validTo,
  }, subject[0].entityType, object[0]?.entityType ?? null);
  if (problems.length) throw new Error(`candidate ${candidate.id} violates predicate registry: ${problems.join("; ")}`);
  return { subject: subject[0]!, object: object[0] ?? null };
}

/** Approves a PROPOSED claim, superseding an open ONE-cardinality value where required. */
export async function approveClaim(db: Db, decision: ReviewDecision): Promise<{ claimId: string; supersededClaimId: string | null; eventId: string }> {
  const actedAt = decision.actedAt ?? new Date().toISOString();
  const [candidate] = await db.select().from(claims).where(eq(claims.id, decision.claimId));
  if (!candidate) throw new Error(`claim ${decision.claimId} not found`);
  if (candidate.status !== "PROPOSED") throw new Error(`claim ${candidate.id} is ${candidate.status}, not PROPOSED`);
  const [{ subject }] = await Promise.all([validateCandidate(db, candidate)]);
  const candidateEvidence = await db.select().from(evidence).where(eq(evidence.claimId, candidate.id));
  if (candidateEvidence.length === 0) throw new Error("an approved claim needs at least one evidence row");
  const analystEvidence = candidateEvidence.filter((row) => row.evidenceClass === "ANALYST");
  if (analystEvidence.length) {
    const assessmentsForCandidate = await db.select().from(assessments).where(eq(assessments.evidenceId, analystEvidence[0]!.id));
    if (!assessmentsForCandidate[0]) throw new Error("ANALYST evidence requires an assessment");
  }
  if (candidateEvidence.some((row) => row.evidenceClass === "DERIVED")) {
    const dependencies = await db.select().from(claimDependencies).where(eq(claimDependencies.derivedClaimId, candidate.id));
    if (dependencies.length === 0) throw new Error("DERIVED evidence requires at least one claim dependency");
  }
  const def = PREDICATES[candidate.predicate as keyof typeof PREDICATES]!;
  let supersededClaimId: string | null = null;
  const eventId = decision.eventId ?? randomUUID();
  await db.transaction(async (tx) => {
    if (def.cardinality === "ONE") {
      const open = await tx.select().from(claims).where(and(
        eq(claims.subjectEntityId, candidate.subjectEntityId), eq(claims.predicate, candidate.predicate),
        eq(claims.status, "APPROVED"), isNull(claims.validTo),
        candidate.stackLayer === null ? isNull(claims.stackLayer) : eq(claims.stackLayer, candidate.stackLayer),
      ));
      const prior = open[0];
      if (prior) {
        supersededClaimId = prior.id;
        await tx.update(claims).set({ status: "SUPERSEDED", validTo: candidate.validFrom, updatedAt: actedAt }).where(eq(claims.id, prior.id));
      }
    }
    await tx.update(claims).set({ status: "APPROVED", updatedAt: actedAt }).where(eq(claims.id, candidate.id));
    await tx.insert(reviewActions).values({ id: decision.reviewActionId ?? randomUUID(), claimId: candidate.id, reviewer: decision.reviewer, action: "APPROVE", actedAt, resultingClaimId: candidate.id, reason: decision.reason ?? null });
    await tx.insert(changeEvents).values({ id: eventId, eventType: eventTypeForClaim(candidate.predicate, subject.entityType), entityId: subject.id, beforeClaimId: supersededClaimId, afterClaimId: candidate.id, observedAt: actedAt, summary: eventSummary(candidate.predicate, subject.name) });
  });
  if (!decision.skipRecompute) await recomputeCachedColumns(db);
  return { claimId: candidate.id, supersededClaimId, eventId };
}

/** Edits a candidate without overwriting it: reject the original and create a replacement PROPOSED row. */
export async function editClaim(db: Db, decision: ReviewDecision & { patch: ClaimPatch }): Promise<{ claimId: string }> {
  const actedAt = decision.actedAt ?? new Date().toISOString();
  const [original] = await db.select().from(claims).where(eq(claims.id, decision.claimId));
  if (!original) throw new Error(`claim ${decision.claimId} not found`);
  if (original.status !== "PROPOSED") throw new Error(`claim ${original.id} is ${original.status}, not PROPOSED`);
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.update(claims).set({ status: "REJECTED", updatedAt: actedAt }).where(eq(claims.id, original.id));
    await tx.insert(claims).values({ ...original, ...decision.patch, id, status: "PROPOSED", createdAt: actedAt, updatedAt: actedAt });
    await tx.insert(reviewActions).values({ id: randomUUID(), claimId: original.id, reviewer: decision.reviewer, action: "EDIT", actedAt, resultingClaimId: id, reason: decision.reason ?? null });
  });
  return { claimId: id };
}

export async function rejectClaim(db: Db, decision: ReviewDecision): Promise<void> {
  const actedAt = decision.actedAt ?? new Date().toISOString();
  const [candidate] = await db.select().from(claims).where(eq(claims.id, decision.claimId));
  if (!candidate) throw new Error(`claim ${decision.claimId} not found`);
  if (candidate.status !== "PROPOSED") throw new Error(`claim ${candidate.id} is ${candidate.status}, not PROPOSED`);
  await db.transaction(async (tx) => {
    await tx.update(claims).set({ status: "REJECTED", updatedAt: actedAt }).where(eq(claims.id, candidate.id));
    await tx.insert(reviewActions).values({ id: randomUUID(), claimId: candidate.id, reviewer: decision.reviewer, action: "REJECT", actedAt, resultingClaimId: null, reason: decision.reason ?? null });
  });
}
