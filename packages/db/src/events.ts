import type { ChangeEventType } from "@ri/domain";

/** Deterministic event mapping used by every claim approval/supersede write path. */
export function eventTypeForClaim(predicate: string, subjectType: string): ChangeEventType {
  if (subjectType === "DEPLOYMENT") return "DEPLOYMENT_ADDED";
  if (predicate === "HAS_COMMERCIAL_STAGE") return "COMMERCIAL_STAGE_CHANGED";
  if (predicate === "HAS_MATURITY") return "MATURITY_CHANGED";
  if (predicate === "PARTNERS_WITH") return "PARTNERSHIP_ADDED";
  if (predicate === "SCORES_ON") return "BENCHMARK_RESULT_ADDED";
  if (predicate === "FUNDED") return "FUNDING_EVENT";
  if (predicate === "ANNOUNCED_ON") return "PRODUCT_LAUNCHED";
  return "CLAIM_CHANGED";
}

export function eventSummary(predicate: string, subjectName: string): string {
  return `${subjectName}: ${predicate.toLowerCase().replaceAll("_", " ")} approved.`;
}
