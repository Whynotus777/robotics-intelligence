import { describe, expect, it } from "vitest";
import { readSeedData } from "./read.js";

const seed = readSeedData();
const sources = new Map(seed.sources.map((source) => [source.key, source.url]));
const claims = seed.entities.flatMap((entity) => entity.claims.map((claim) => ({ entity, claim })));

describe("enrichment evidence policy", () => {
  it("requires sourced factual evidence for ownership and investment relationships", () => {
    for (const { entity, claim } of claims.filter(({ claim }) => ["PART_OF", "INVESTED_IN"].includes(claim.predicate))) {
      const supporting = claim.evidence.filter((evidence) => evidence.stance === "SUPPORTS");
      expect(supporting.length, `${entity.slug}:${claim.predicate}`).toBeGreaterThan(0);
      for (const evidence of supporting) {
        expect(["PRIMARY", "THIRD_PARTY"]).toContain(evidence.class);
        expect(sources.get(evidence.source ?? "")).toMatch(/^https?:\/\//);
      }
    }
  });

  it("dates every parent affiliation", () => {
    for (const { entity, claim } of claims.filter(({ claim }) => claim.predicate === "PART_OF")) {
      expect(claim.valid_from, entity.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("keeps roster-only headquarters explicitly provisional", () => {
    for (const { entity, claim } of claims.filter(({ claim }) => claim.predicate === "HQ_AT")) {
      for (const evidence of claim.evidence) {
        if (!sources.get(evidence.source ?? "")?.includes("/research/roster/")) continue;
        expect(evidence.class, entity.slug).toBe("ANALYST");
        expect(evidence.confidence, entity.slug).toBe("LOW");
        expect(claim.qualifier, entity.slug).toContain("Provisional");
        expect(evidence.assessment?.rationale).toBeTruthy();
      }
    }
  });
});
