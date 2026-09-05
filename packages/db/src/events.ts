import {
  COMMERCIAL_STAGES,
  ENUM_LABELS,
  MATURITIES,
  PREDICATES,
  type ChangeEventType,
  type EnumName,
  type PredicateDefinition,
} from "@ri/domain";

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

/**
 * What a summary needs from a claim. The row itself stays structured — the before
 * and after values are served to clients as they are; this is only the sentence.
 */
export type ClaimFacts = {
  predicate: string;
  valueText?: string | null;
  valueNumber?: number | null;
  unit?: string | null;
  isApproximate?: boolean | null;
  valueEnum?: string | null;
  valueDate?: string | null;
  /** Name of the object entity, resolved by the caller; ENTITY claims have one. */
  objectName?: string | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Formatted here rather than through Intl so a fixture is byte-identical anywhere. */
function decimal(value: number): string {
  const [whole, fraction] = Math.abs(value).toFixed(Math.abs(value) % 1 === 0 ? 0 : 2).split(".");
  const grouped = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmed = fraction?.replace(/0+$/, "");
  return `${value < 0 ? "-" : ""}${grouped}${trimmed ? `.${trimmed}` : ""}`;
}

function duration(seconds: number): string {
  if (seconds >= 3600) return `${decimal(seconds / 3600)} h`;
  if (seconds >= 60) return `${decimal(seconds / 60)} min`;
  return `${decimal(seconds)} s`;
}

function date(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-");
  const name = MONTHS[Number(month) - 1];
  return name ? `${Number(day)} ${name} ${year}` : iso;
}

/** The registry is a union of literal shapes; this reads one entry as its interface. */
function predicate(name: string): PredicateDefinition | undefined {
  return PREDICATES[name as keyof typeof PREDICATES] as PredicateDefinition | undefined;
}

function enumLabel(predicateName: string, value: string): string {
  const name = predicate(predicateName)?.enum_name as EnumName | undefined;
  const label = name ? ENUM_LABELS[name][value] : undefined;
  if (label) return label;
  // Never echo the identifier: a value outside the registry still reads as words.
  const words = value.toLowerCase().replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The value as a reader would say it. Enums resolve through the display labels. */
export function claimValueText(facts: ClaimFacts): string | null {
  if (facts.objectName) return facts.objectName;
  if (facts.valueEnum) return enumLabel(facts.predicate, facts.valueEnum);
  if (facts.valueDate) return date(facts.valueDate);
  if (facts.valueNumber !== null && facts.valueNumber !== undefined) {
    const approx = facts.isApproximate ? "~" : "";
    if (facts.unit === "USD") return `${approx}$${decimal(facts.valueNumber)}`;
    if (facts.unit === "s") return `${approx}${duration(facts.valueNumber)}`;
    if (facts.unit === "count" || facts.unit === "units" || !facts.unit) return `${approx}${decimal(facts.valueNumber)}`;
    return `${approx}${decimal(facts.valueNumber)} ${facts.unit}`;
  }
  if (facts.valueText) {
    const text = facts.valueText.trim().replace(/\s+/g, " ");
    return text.length > 72 ? `${text.slice(0, 71)}…` : text;
  }
  return null;
}

const ORDINALS: Record<string, readonly string[]> = {
  HAS_MATURITY: MATURITIES,
  HAS_COMMERCIAL_STAGE: COMMERCIAL_STAGES,
};

/** "raised"/"lowered" only where the enum is a ladder and both rungs are known. */
function movement(predicate: string, before: string | null | undefined, after: string): "raised" | "lowered" | "moved" {
  const scale = ORDINALS[predicate];
  if (!scale || !before) return "moved";
  const from = scale.indexOf(before);
  const to = scale.indexOf(after);
  if (from === -1 || to === -1 || from === to) return "moved";
  return to > from ? "raised" : "lowered";
}

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Labels that already read as a verb, so they take their value directly. */
const VERB_LABELS = new Set(["FUNDED", "USES_EMBODIMENT"]);

/** How a deployment's own claims read once the deployment itself is the subject. */
const DEPLOYMENT_PHRASE: Record<string, string> = {
  OCCURS_AT: "at",
  USES_ROBOT: "using",
  SERVES_TASK: "for",
  OPERATED_BY: ", operated by",
  DEPLOYED_BY: ", deployed by",
  BEGAN: ", beginning",
};

/**
 * A change event as a sentence rather than a predicate name: "Embodiment set to
 * Quadruped", "Maturity raised to Scaling", "List price changed from $20,000 to
 * $16,000", "Deployment added at BMW Spartanburg".
 *
 * The subject is not repeated — every surface that shows a summary shows the entity
 * chip beside it — so the sentence starts with what actually changed.
 */
export function eventSummary(input: {
  subject: { name: string; entityType: string };
  after: ClaimFacts;
  before?: ClaimFacts | null;
}): string {
  const { after, before, subject } = input;
  const definition = predicate(after.predicate);
  const value = claimValueText(after);
  const previous = before ? claimValueText(before) : null;

  if (subject.entityType === "DEPLOYMENT") {
    const phrase = DEPLOYMENT_PHRASE[after.predicate];
    return phrase && value ? `Deployment added ${phrase} ${value}`.replace(" ,", ",") : "Deployment added";
  }

  if (!definition || !value) return `${sentenceCase(definition?.label ?? "Claim")} recorded`;
  const label = definition.label;

  // ENTITY and DATE predicates are phrased as verbs already: "competes with",
  // "was announced on". Dropping the copula leaves a sentence about the subject.
  if (definition.value_kind === "ENTITY" || definition.value_kind === "DATE" || VERB_LABELS.has(after.predicate)) {
    return `${sentenceCase(label.replace(/^(is|was) /, ""))} ${value}`;
  }

  if (definition.value_kind === "ENUM") {
    if (!previous) return `${sentenceCase(label)} set to ${value}`;
    const verb = movement(after.predicate, before?.valueEnum, after.valueEnum ?? "");
    return `${sentenceCase(label)} ${verb} to ${value}`;
  }

  if (definition.value_kind === "NUMBER") {
    return previous && previous !== value
      ? `${sentenceCase(label)} changed from ${previous} to ${value}`
      : `${sentenceCase(label)} set to ${value}`;
  }

  // TEXT claims carry their content in the sentence: nothing else on the page shows
  // it, because a first claim has no before/after pair to render.
  return `${sentenceCase(label)} ${previous ? "updated" : "recorded"}: ${value}`;
}
