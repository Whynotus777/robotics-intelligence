import "server-only";
import type { CompareResponse, EntityChip, EntityResponse } from "@ri/api-contracts";
import { STACK_LAYERS } from "@ri/domain";
import { data, orNotFound } from "@/lib/data";
import { STACK_LAYER_LABEL, sentenceCase } from "@/lib/vocabulary";

/**
 * Compare reads the /compare projection. Any set of two to four slugs must
 * answer, so when the provider has no answer for this exact set the same shape
 * is composed from the entity payloads the columns already carry: rows keyed by
 * stack layer (or attribute family), and a row kept only where at least two
 * columns have a value.
 */

export const MIN_COLUMNS = 2;
export const MAX_COLUMNS = 4;

const ATTRIBUTE_GROUPS: Record<string, string> = {
  HAS_HEIGHT: "PHYSICAL",
  HAS_MASS: "PHYSICAL",
  HAS_PAYLOAD: "PHYSICAL",
  HAS_DOF: "PHYSICAL",
  HAS_REACH: "PHYSICAL",
  HAS_RUNTIME: "PERFORMANCE",
  SCORES_ON: "PERFORMANCE",
  HAS_LIST_PRICE: "COMMERCIAL",
  HAS_COMMERCIAL_STAGE: "COMMERCIAL",
};

const FAMILY_ORDER = ["IDENTITY", "PHYSICAL", "PERFORMANCE", "COMMERCIAL"];

/** Canonical stack layers first, then the attribute families, then anything new. */
export function groupRank(group: string): number {
  const layer = (STACK_LAYERS as readonly string[]).indexOf(group);
  if (layer !== -1) return layer;
  const family = FAMILY_ORDER.indexOf(group);
  return family === -1 ? STACK_LAYERS.length + FAMILY_ORDER.length : STACK_LAYERS.length + family;
}

export function groupLabel(group: string): string {
  return STACK_LAYER_LABEL[group] ?? sentenceCase(group.replaceAll("_", " ").toLowerCase());
}

export type CompareView = {
  response: CompareResponse;
  /** Slugs that were asked for but are not in the comparison, with the reason. */
  dropped: { slug: string; reason: "missing" | "type" }[];
  entityType: string;
};

export async function compareView(slugs: string[]): Promise<CompareView | null> {
  const provider = await data();
  const wanted = slugs.filter((slug, index) => slug.length > 0 && slugs.indexOf(slug) === index);
  if (wanted.length === 0) return null;

  const loaded = await Promise.all(wanted.map((slug) => orNotFound(provider.entity(slug))));
  const dropped: { slug: string; reason: "missing" | "type" }[] = [];
  const present: EntityResponse[] = [];
  for (const [index, entity] of loaded.entries()) {
    if (entity) present.push(entity);
    else dropped.push({ slug: wanted[index]!, reason: "missing" });
  }
  if (present.length === 0) return null;

  // Columns must be the same kind of thing; the first one sets the type.
  const entityType = present[0]!.entity.entity_type;
  const columns: EntityResponse[] = [];
  for (const entity of present) {
    if (entity.entity.entity_type !== entityType) dropped.push({ slug: entity.entity.slug, reason: "type" });
    else if (columns.length < MAX_COLUMNS) columns.push(entity);
  }
  if (columns.length < MIN_COLUMNS) return null;

  const response =
    (await orNotFound(provider.compare(columns.map((entity) => entity.entity.slug)))) ??
    composeCompare(columns);

  return { response, dropped, entityType };
}

type Cell = CompareResponse["groups"][number]["rows"][number]["cells"][number];
type Row = { predicate: string; label: string; cells: Cell[] };

/** The /compare projection, composed from entity payloads. Same rules, same shape. */
function composeCompare(columns: EntityResponse[]): CompareResponse {
  const rows = new Map<string, Row>();

  const put = (
    key: string,
    predicate: string,
    label: string,
    index: number,
    value: NonNullable<Cell>["values"][number],
  ) => {
    const row =
      rows.get(key) ??
      (rows.set(key, {
        predicate,
        label,
        cells: Array.from({ length: columns.length }, () => null as Cell),
      }),
      rows.get(key)!);
    const cell = row.cells[index];
    if (cell) cell.values.push(value);
    else row.cells[index] = { values: [value] };
  };

  for (const [index, entity] of columns.entries()) {
    for (const group of entity.claims) {
      if (group.predicate === "HAS_ARCHITECTURE_NOTE") continue;
      for (const claim of group.claims)
        put(
          `${claim.stack_layer ?? (ATTRIBUTE_GROUPS[group.predicate] ?? "IDENTITY")}:${group.predicate}`,
          group.predicate,
          group.label,
          index,
          {
            claim_id: claim.claim_id,
            qualifier: claim.qualifier,
            value: claim.value,
            evidence_summary: claim.evidence_summary,
          },
        );
    }
    for (const group of entity.relationships)
      for (const item of group.items)
        put(
          `${item.stack_layer ?? (ATTRIBUTE_GROUPS[group.predicate] ?? "IDENTITY")}:${group.predicate}`,
          group.predicate,
          group.label,
          index,
          {
            claim_id: item.claim_id,
            qualifier: item.qualifier,
            value: { kind: "entity", entity: item.target, measure: null },
            evidence_summary: item.evidence_summary,
          },
        );
  }

  const groups = new Map<string, { group: string; label: string; rows: Row[] }>();
  for (const [key, value] of rows) {
    if (value.cells.filter(Boolean).length < 2) continue;
    const group = key.slice(0, key.indexOf(":"));
    const bucket =
      groups.get(group) ?? (groups.set(group, { group, label: group.replaceAll("_", " "), rows: [] }), groups.get(group)!);
    bucket.rows.push(value);
  }

  return {
    columns: columns.map((entity) => chip(entity)),
    groups: [...groups.values()],
    as_of: columns[0]?.as_of ?? null,
  };
}

function chip(entity: EntityResponse): EntityChip {
  return {
    id: entity.entity.id,
    slug: entity.entity.slug,
    entity_type: entity.entity.entity_type,
    name: entity.entity.name,
    primary_embodiment: entity.entity.primary_embodiment,
  };
}
