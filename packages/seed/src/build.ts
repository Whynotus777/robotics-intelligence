import {
  CANONICAL_LAYERS,
  normalizeName,
  validateClaimShape,
  type EntityType,
  type Predicate,
} from "@ri/domain";
import type {
  assessments,
  claimDependencies,
  claims,
  embodimentLayerLabels,
  entities,
  entityAliases,
  evidence,
  places,
  sources,
} from "@ri/db";
import { claimId, entityId, evidenceId, sourceId } from "./ids.js";
import type { SeedInput } from "./read.js";

/** Editorial defaults for timestamps the YAML leaves out. */
export const SEED_OBSERVED_AT = "2026-09-01";

const ts = (date: string) => `${date}T00:00:00.000Z`;

export interface SeedRows {
  entities: (typeof entities.$inferInsert)[];
  aliases: (typeof entityAliases.$inferInsert)[];
  places: (typeof places.$inferInsert)[];
  sources: (typeof sources.$inferInsert)[];
  claims: (typeof claims.$inferInsert)[];
  dependencies: (typeof claimDependencies.$inferInsert)[];
  evidence: (typeof evidence.$inferInsert)[];
  assessments: (typeof assessments.$inferInsert)[];
  layerLabels: (typeof embodimentLayerLabels.$inferInsert)[];
}

/** Turns parsed YAML into insert rows, validating every cross-reference and claim shape. */
export function buildRows(input: SeedInput): SeedRows {
  const problems: string[] = [];
  const typeBySlug = new Map<string, EntityType>();
  for (const e of input.entities) {
    if (typeBySlug.has(e.slug)) problems.push(`duplicate slug ${e.slug}`);
    typeBySlug.set(e.slug, e.entity_type);
  }
  const sourceKeys = new Set(input.sources.map((s) => s.key));
  const claimRefs = new Set<string>();

  const rows: SeedRows = {
    entities: [],
    aliases: [],
    places: [],
    sources: [],
    claims: [],
    dependencies: [],
    evidence: [],
    assessments: [],
    layerLabels: [],
  };

  for (const s of input.sources) {
    rows.sources.push({
      id: sourceId(s.key),
      url: s.url,
      canonicalUrl: s.canonical_url ?? null,
      publisher: s.publisher ?? null,
      title: s.title ?? null,
      sourceKind: s.source_kind,
      publishedAt: s.published_at ? ts(s.published_at) : null,
      language: s.language,
      licensePolicy: s.license_policy,
      extractionStatus: s.extraction_status,
      refreshCadence: s.refresh_cadence,
      nextCheckAt: s.next_check_at ? ts(s.next_check_at) : null,
      priority: s.priority,
    });
  }

  // Pass 1: entities and claim keys (so dependencies can point forward).
  const keysByEntity = new Map<string, string[]>();
  for (const e of input.entities) {
    const seen = new Map<string, number>();
    const keys = e.claims.map((c) => {
      if (c.key) return c.key;
      const n = (seen.get(c.predicate) ?? 0) + 1;
      seen.set(c.predicate, n);
      return n === 1 ? c.predicate : `${c.predicate}#${n}`;
    });
    if (new Set(keys).size !== keys.length) problems.push(`${e.slug}: duplicate claim keys`);
    keysByEntity.set(e.slug, keys);
    for (const k of keys) claimRefs.add(`${e.slug}:${k}`);
  }

  for (const e of input.entities) {
    const id = entityId(e.slug);
    rows.entities.push({
      id,
      slug: e.slug,
      entityType: e.entity_type,
      name: e.name,
      normalizedName: normalizeName(e.name),
      shortDescription: e.short_description ?? null,
      primaryEmbodiment: e.primary_embodiment ?? null,
      countryCode: e.country_code ?? null,
      depthTier: e.depth_tier,
      createdAt: ts(SEED_OBSERVED_AT),
      updatedAt: ts(SEED_OBSERVED_AT),
    });
    for (const alias of e.aliases) rows.aliases.push({ entityId: id, alias, normalized: normalizeName(alias) });
    if (e.place) {
      rows.places.push({
        entityId: id,
        adminRegion: e.place.admin_region ?? null,
        city: e.place.city ?? null,
        lat: e.place.lat,
        lng: e.place.lng,
        clusterLabel: e.place.cluster_label ?? null,
      });
    } else if (e.entity_type === "PLACE") {
      problems.push(`${e.slug}: PLACE entities need a place block`);
    }

    const keys = keysByEntity.get(e.slug)!;
    e.claims.forEach((c, i) => {
      const key = keys[i]!;
      const cid = claimId(e.slug, key);
      const objectType = c.object ? (typeBySlug.get(c.object) ?? null) : null;
      if (c.object && !objectType) problems.push(`${e.slug}:${key}: object ${c.object} does not exist`);
      const evidenceDates = c.evidence.map((ev) => ev.published_at ?? ev.assessment?.reviewed_at).filter((d): d is string => !!d);
      const validFrom = c.valid_from ?? (evidenceDates.length ? evidenceDates.sort()[0]! : SEED_OBSERVED_AT);
      const observed = c.observed_at ?? SEED_OBSERVED_AT;
      const shape = {
        predicate: c.predicate,
        value_text: c.text ?? null,
        value_number: c.number ?? null,
        unit: c.unit ?? null,
        is_approximate: c.approximate,
        value_min: c.min ?? null,
        value_max: c.max ?? null,
        value_enum: c.enum ?? null,
        object_entity_id: c.object ? entityId(c.object) : null,
        value_date: c.date ?? null,
        stack_layer: c.stack_layer ?? null,
        valid_from: validFrom,
        valid_to: c.valid_to ?? null,
      };
      for (const p of validateClaimShape(shape, e.entity_type, objectType)) problems.push(`${e.slug}:${key}: ${p}`);
      if (c.status === "APPROVED" && c.valid_to) problems.push(`${e.slug}:${key}: APPROVED claims cannot have valid_to; use SUPERSEDED`);
      if (c.status === "SUPERSEDED" && !c.valid_to) problems.push(`${e.slug}:${key}: SUPERSEDED claims need valid_to`);

      rows.claims.push({
        id: cid,
        subjectEntityId: id,
        predicate: c.predicate as Predicate,
        valueText: shape.value_text,
        valueNumber: shape.value_number,
        unit: shape.unit,
        isApproximate: shape.is_approximate,
        valueMin: shape.value_min,
        valueMax: shape.value_max,
        valueEnum: shape.value_enum,
        objectEntityId: shape.object_entity_id,
        valueDate: shape.value_date,
        stackLayer: shape.stack_layer,
        status: c.status,
        origin: c.origin,
        validFrom: validFrom,
        validTo: shape.valid_to,
        observedAt: ts(observed),
        lastVerifiedAt: ts(c.last_verified_at ?? observed),
        createdAt: ts(observed),
        updatedAt: ts(observed),
      });

      for (const dep of c.depends_on) {
        if (!claimRefs.has(dep)) problems.push(`${e.slug}:${key}: depends_on ${dep} does not exist`);
        const [depSlug, depKey] = dep.split(":") as [string, string];
        rows.dependencies.push({ derivedClaimId: cid, inputClaimId: claimId(depSlug, depKey) });
      }

      const hasDerived = c.evidence.some((ev) => ev.class === "DERIVED");
      if (hasDerived && c.depends_on.length === 0) problems.push(`${e.slug}:${key}: DERIVED evidence requires depends_on`);
      const sourced = c.evidence.some((ev) => ev.class !== "ANALYST");
      if (c.status !== "PROPOSED" && sourced === false && !c.evidence.some((ev) => ev.class === "ANALYST")) {
        problems.push(`${e.slug}:${key}: approved claims need evidence`);
      }

      c.evidence.forEach((ev, j) => {
        const eid = evidenceId(e.slug, key, j);
        const needsSource = ev.class !== "ANALYST" && ev.class !== "DERIVED";
        if (needsSource && !ev.source) problems.push(`${e.slug}:${key}: ${ev.class} evidence needs a source`);
        if (ev.source && !sourceKeys.has(ev.source)) problems.push(`${e.slug}:${key}: source ${ev.source} does not exist`);
        if (ev.class === "ANALYST" && !ev.assessment) problems.push(`${e.slug}:${key}: ANALYST evidence needs an assessment`);
        if (ev.class !== "ANALYST" && ev.assessment) problems.push(`${e.slug}:${key}: only ANALYST evidence carries an assessment`);
        rows.evidence.push({
          id: eid,
          claimId: cid,
          sourceId: ev.source ? sourceId(ev.source) : null,
          evidenceClass: ev.class,
          confidence: ev.confidence,
          stance: ev.stance,
          excerpt: ev.excerpt ?? null,
          publishedAt: ev.published_at ? ts(ev.published_at) : ev.assessment?.reviewed_at ? ts(ev.assessment.reviewed_at) : null,
          observedAt: ts(ev.observed_at ?? observed),
        });
        if (ev.assessment) {
          const a = ev.assessment;
          if (a.advance_criteria.length === 0) problems.push(`${e.slug}:${key}: assessment needs advance_criteria`);
          for (const ref of a.evidence_considered) if (!claimRefs.has(ref)) problems.push(`${e.slug}:${key}: evidence_considered ${ref} does not exist`);
          rows.assessments.push({
            evidenceId: eid,
            author: a.author,
            rationale: a.rationale,
            advanceCriteria: a.advance_criteria,
            regressCriteria: a.regress_criteria,
            evidenceConsidered: a.evidence_considered.map((ref) => {
              const [s, k] = ref.split(":") as [string, string];
              return claimId(s, k);
            }),
            reviewedAt: ts(a.reviewed_at ?? observed),
            notes: a.notes ?? null,
          });
        }
      });
    });
  }

  for (const [embodiment, layers] of Object.entries(input.layerLabels)) {
    for (const layer of CANONICAL_LAYERS) {
      const label = layers[layer];
      if (label === undefined) problems.push(`layer labels: ${embodiment} is missing ${layer}`);
      rows.layerLabels.push({
        embodiment: embodiment as (typeof embodimentLayerLabels.$inferInsert)["embodiment"],
        layer,
        label: label ?? titleCase(layer),
        applies: label !== null && label !== undefined,
      });
    }
  }

  if (problems.length) throw new Error(`seed validation failed:\n  ${problems.join("\n  ")}`);
  return rows;
}

function titleCase(layer: string): string {
  return layer.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
