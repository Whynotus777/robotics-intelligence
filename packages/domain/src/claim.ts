import { z } from "zod";
import { ClaimStatus, ENUM_VALUES, StackLayer, Unit } from "./enums.js";
import { PREDICATES, isPredicate, type Predicate } from "./predicates.js";
import type { EntityType } from "./enums.js";

export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

/**
 * A claims row. Exactly one primary value column is set: value_text, value_number,
 * value_enum, object_entity_id, or value_date. A NUMBER claim may add unit,
 * is_approximate, value_min, value_max. SCORES_ON (an ENTITY claim with `measure`)
 * may add value_number + unit next to its object.
 */
export const ClaimRow = z.object({
  id: z.uuid(),
  subject_entity_id: z.uuid(),
  predicate: z.string().refine(isPredicate, "unknown predicate"),
  value_text: z.string().nullable(),
  value_number: z.number().nullable(),
  unit: Unit.nullable(),
  is_approximate: z.boolean(),
  value_min: z.number().nullable(),
  value_max: z.number().nullable(),
  value_enum: z.string().nullable(),
  object_entity_id: z.uuid().nullable(),
  value_date: IsoDate.nullable(),
  stack_layer: StackLayer.nullable(),
  status: ClaimStatus,
  valid_from: IsoDate,
  valid_to: IsoDate.nullable(),
  observed_at: z.iso.datetime(),
  last_verified_at: z.iso.datetime(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});
export type ClaimRow = z.infer<typeof ClaimRow>;

export const ClaimDependency = z.object({
  derived_claim_id: z.uuid(),
  input_claim_id: z.uuid(),
});
export type ClaimDependency = z.infer<typeof ClaimDependency>;

export type ClaimShape = { predicate: string } & Pick<
  ClaimRow,
  | "value_text"
  | "value_number"
  | "unit"
  | "is_approximate"
  | "value_min"
  | "value_max"
  | "value_enum"
  | "object_entity_id"
  | "value_date"
  | "stack_layer"
  | "valid_from"
  | "valid_to"
>;

/**
 * Registry conformance for a single claim. Returns a list of problems (empty = valid).
 * Pure: the caller supplies the entity types of subject and object.
 */
export function validateClaimShape(
  claim: ClaimShape,
  subjectType: EntityType,
  objectType: EntityType | null,
): string[] {
  const problems: string[] = [];
  if (!isPredicate(claim.predicate)) return [`unknown predicate ${claim.predicate}`];
  const predicate: Predicate = claim.predicate;
  const def = PREDICATES[predicate];

  if (!(def.subject_types as readonly string[]).includes(subjectType)) {
    problems.push(`${predicate}: subject type ${subjectType} not allowed`);
  }

  const set = {
    text: claim.value_text !== null,
    number: claim.value_number !== null,
    enum: claim.value_enum !== null,
    entity: claim.object_entity_id !== null,
    date: claim.value_date !== null,
  };
  const expected: Record<string, keyof typeof set> = {
    TEXT: "text",
    NUMBER: "number",
    ENUM: "enum",
    ENTITY: "entity",
    DATE: "date",
  };
  const primary = expected[def.value_kind]!;
  if (!set[primary]) problems.push(`${predicate}: expected ${def.value_kind} value`);
  for (const [k, on] of Object.entries(set)) {
    if (!on || k === primary) continue;
    const measureOk = k === "number" && def.value_kind === "ENTITY" && "measure" in def && def.measure;
    if (!measureOk) problems.push(`${predicate}: unexpected ${k} value on a ${def.value_kind} claim`);
  }

  if (def.value_kind === "NUMBER" || ("measure" in def && def.measure && claim.value_number !== null)) {
    if (claim.unit !== (def.unit ?? null)) problems.push(`${predicate}: unit must be ${def.unit}, got ${claim.unit}`);
    if (claim.value_min !== null && claim.value_max !== null && claim.value_min > claim.value_max) {
      problems.push(`${predicate}: value_min > value_max`);
    }
  } else if (claim.unit !== null || claim.value_min !== null || claim.value_max !== null) {
    problems.push(`${predicate}: unit/min/max only allowed on numeric claims`);
  }

  if (def.value_kind === "ENUM" && claim.value_enum !== null) {
    const allowed = ENUM_VALUES[def.enum_name!];
    if (!allowed.includes(claim.value_enum)) problems.push(`${predicate}: ${claim.value_enum} not in ${def.enum_name}`);
  }

  if (def.value_kind === "ENTITY") {
    if (objectType === null) problems.push(`${predicate}: object entity missing`);
    else if (!(def.object_types as readonly string[] | undefined)?.includes(objectType)) {
      problems.push(`${predicate}: object type ${objectType} not allowed`);
    }
    if (predicate === "COMPETES_WITH" && objectType !== null && objectType !== subjectType) {
      problems.push(`COMPETES_WITH: subject (${subjectType}) and object (${objectType}) must share a type`);
    }
  }

  if (def.stack_layer === "REQUIRED" && claim.stack_layer === null) problems.push(`${predicate}: stack_layer required`);
  if (def.stack_layer === "FORBIDDEN" && claim.stack_layer !== null) problems.push(`${predicate}: stack_layer not allowed`);

  if (claim.valid_to !== null && claim.valid_to < claim.valid_from) problems.push(`${predicate}: valid_to < valid_from`);

  return problems;
}
