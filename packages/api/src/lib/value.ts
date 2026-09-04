import type { ClaimValue } from "@ri/api-contracts";
import { PREDICATES } from "@ri/domain";
import type { claims, entities } from "@ri/db";

export type ClaimRow = typeof claims.$inferSelect;
export type EntityRow = typeof entities.$inferSelect;

/** Converts storage's typed columns into the one public claim-value union. */
export function rowValue(row: ClaimRow, object?: EntityRow | null): ClaimValue {
  if (row.valueText !== null) return { kind: "text", text: row.valueText };
  if (row.valueEnum !== null) return { kind: "enum", value: row.valueEnum };
  if (row.valueDate !== null) return { kind: "date", date: row.valueDate };
  if (row.objectEntityId !== null && object) {
    return {
      kind: "entity",
      entity: { id: object.id, slug: object.slug, entity_type: object.entityType, name: object.name, primary_embodiment: object.primaryEmbodiment },
      measure: row.valueNumber === null || row.unit === null ? null : { number: row.valueNumber, unit: row.unit as never },
    };
  }
  if (row.valueNumber !== null && row.unit !== null) {
    return { kind: "number", number: row.valueNumber, unit: row.unit as never, is_approximate: row.isApproximate, min: row.valueMin, max: row.valueMax };
  }
  throw new Error(`claim ${row.id} has no renderable value`);
}

export function predicateLabel(predicate: string): string {
  return PREDICATES[predicate as keyof typeof PREDICATES]?.label ?? predicate.toLowerCase().replace(/_/g, " ");
}

export function rowSentence(row: ClaimRow, subject: EntityRow, object?: EntityRow | null): string {
  const label = predicateLabel(row.predicate);
  const value = rowValue(row, object);
  const rendered = value.kind === "text" ? value.text : value.kind === "enum" ? value.value : value.kind === "date" ? value.date : value.kind === "entity" ? value.entity.name : `${value.is_approximate ? "~" : ""}${value.number.toLocaleString()} ${value.unit}`;
  return `${subject.name} ${label} ${rendered}`;
}
