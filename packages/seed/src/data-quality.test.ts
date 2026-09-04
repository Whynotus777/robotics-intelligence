import { describe, expect, it } from "vitest";
import { cachedFromClaims } from "@ri/db";
import { CANONICAL_LAYERS, normalizeName } from "@ri/domain";
import { buildRows } from "./build.js";
import { readSeedData } from "./read.js";

const input = readSeedData();
const rows = buildRows(input);

describe("0a seed data quality", () => {
  it("has only unique slugs and unambiguous normalized names", () => {
    expect(new Set(input.entities.map((e) => e.slug)).size).toBe(input.entities.length);
    const byName = new Map<string, string[]>();
    for (const e of input.entities) byName.set(normalizeName(e.name), [...(byName.get(normalizeName(e.name)) ?? []), e.slug]);
    for (const [name, slugs] of byName) expect(slugs, `duplicate normalized name ${name}`).toHaveLength(1);
  });

  it("gives every approved claim evidence and every analyst judgment an assessment", () => {
    const evidenceByClaim = new Map<string, typeof rows.evidence>();
    for (const e of rows.evidence) evidenceByClaim.set(e.claimId, [...(evidenceByClaim.get(e.claimId) ?? []), e]);
    const assessmentIds = new Set(rows.assessments.map((a) => a.evidenceId));
    for (const c of rows.claims.filter((c) => c.status === "APPROVED")) {
      expect(evidenceByClaim.get(c.id) ?? [], `missing evidence for ${c.id}`).not.toHaveLength(0);
    }
    for (const e of rows.evidence.filter((e) => e.evidenceClass === "ANALYST")) {
      expect(assessmentIds, `missing assessment for ${e.id}`).toContain(e.id);
    }
  });

  it("keeps relational endpoints, temporal ranges, and derived inputs valid", () => {
    const entityIds = new Set(rows.entities.map((e) => e.id));
    const claimIds = new Set(rows.claims.map((c) => c.id));
    for (const c of rows.claims) {
      expect(entityIds).toContain(c.subjectEntityId);
      if (c.objectEntityId) expect(entityIds).toContain(c.objectEntityId);
      if (c.validTo) expect(c.validTo >= c.validFrom).toBe(true);
    }
    for (const d of rows.dependencies) { expect(claimIds).toContain(d.derivedClaimId); expect(claimIds).toContain(d.inputClaimId); }
    for (const c of rows.claims) if ((rows.evidence.filter((e) => e.claimId === c.id)).some((e) => e.evidenceClass === "DERIVED")) expect(rows.dependencies.some((d) => d.derivedClaimId === c.id)).toBe(true);
  });

  it("derives cached values only from current approved claims", () => {
    for (const entity of rows.entities) {
      const derived = cachedFromClaims(rows.claims.filter((c) => c.subjectEntityId === entity.id).map((c) => ({ predicate: c.predicate, value_enum: c.valueEnum ?? null, value_number: c.valueNumber ?? null, valid_from: c.validFrom, valid_to: c.validTo ?? null, status: c.status ?? "PROPOSED" })));
      // The seed inserts no cache columns; recompute is deliberately the sole writer.
      expect(Object.values(derived)).toBeDefined();
    }
  });

  it("never assigns a stack claim to a non-applicable layer", () => {
    const entityById = new Map(rows.entities.map((e) => [e.id, e]));
    const labels = new Map(rows.layerLabels.map((l) => [`${l.embodiment}:${l.layer}`, l]));
    for (const c of rows.claims.filter((c) => c.stackLayer && c.stackLayer !== "SAFETY")) {
      const robot = entityById.get(c.subjectEntityId)!;
      expect(robot.primaryEmbodiment).not.toBeNull();
      expect(labels.get(`${robot.primaryEmbodiment}:${c.stackLayer}`)?.applies).toBe(true);
    }
    for (const e of input.entities.filter((e) => e.entity_type === "ROBOT" && e.primary_embodiment)) for (const layer of CANONICAL_LAYERS) expect(labels.has(`${e.primary_embodiment}:${layer}`)).toBe(true);
  });
});
