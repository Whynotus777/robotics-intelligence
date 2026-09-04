import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ExploreResponse } from "@ri/api-contracts";
import { ExploreTerritories } from "./ExploreTerritories.js";
import { fixture, isLabel, rawEnumTokens, svgLabels } from "./fixtures.test-helper.js";

const LENSES = ["embodiment", "market", "technology", "geography", "maturity"] as const;

function render(lens: (typeof LENSES)[number]) {
  const data = fixture<ExploreResponse>(`explore/${lens}/none`);
  return { data, markup: renderToStaticMarkup(<ExploreTerritories data={data} />) };
}

describe("ExploreTerritories", () => {
  it("paints region labels after every district fill so they are never covered", () => {
    const { markup } = render("embodiment");
    const lastDistrict = markup.lastIndexOf('class="ri-territories__district"');
    const firstRegionLabel = markup.indexOf('class="ri-territories__region-label"');
    expect(lastDistrict).toBeGreaterThan(-1);
    expect(firstRegionLabel).toBeGreaterThan(-1);
    // SVG has no z-index: later siblings paint on top of earlier ones.
    expect(firstRegionLabel).toBeGreaterThan(lastDistrict);
  });

  it("draws the region label the response computed, not the district's identifier", () => {
    const { data, markup } = render("embodiment");
    const drawn = svgLabels(markup);
    for (const region of data.regions) {
      const label = region.label.toUpperCase();
      expect(drawn.some((text) => isLabel(text, label)), region.id).toBe(true);
    }
    // "Humanoids" is the label; "HUMANOID" alone was the district id that used to win.
    expect(drawn).toContain("HUMANOIDS");
    expect(drawn).not.toContain("HUMANOID");
  });

  it("renders no unresolved enum identifier under any lens", () => {
    for (const lens of LENSES) {
      const { markup } = render(lens);
      expect(rawEnumTokens(markup), lens).toEqual([]);
    }
  });

  it("draws only strings the response supplied as labels or counts", () => {
    for (const lens of LENSES) {
      const { data, markup } = render(lens);
      const allowed = new Set<string>();
      for (const region of data.regions) {
        allowed.add(region.label.toUpperCase());
        allowed.add(`${region.count} ${region.count === 1 ? "entity" : "entities"}`);
        for (const district of region.districts) allowed.add(district.label);
      }
      const drawn = svgLabels(markup);
      expect(drawn.length, lens).toBeGreaterThan(0);
      for (const text of drawn) {
        expect([...allowed].some((label) => isLabel(text, label)), `${lens}: ${text}`).toBe(true);
      }
    }
  });
});
