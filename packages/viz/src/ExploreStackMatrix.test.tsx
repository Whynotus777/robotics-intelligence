import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CANONICAL_LAYERS, STACK_LAYER_LABEL } from "@ri/domain";
import type { StackMatrixResponse } from "@ri/api-contracts";
import { ExploreStackMatrix } from "./ExploreStackMatrix.js";
import { fixture, rawEnumTokens, visibleText } from "./fixtures.test-helper.js";

const LENSES = ["embodiment", "market", "technology", "geography", "maturity"] as const;

function render(lens: (typeof LENSES)[number]) {
  const data = fixture<StackMatrixResponse>(`stack-matrix/${lens}`);
  return { data, markup: renderToStaticMarkup(<ExploreStackMatrix data={data} />) };
}

/** The grid emits one cell per column per layer, in CANONICAL_LAYERS order. */
function cellsByLayerAndColumn(markup: string, data: StackMatrixResponse) {
  const cells = [...markup.matchAll(/<div class="ri-matrix__cell"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => m[1]!);
  expect(cells).toHaveLength(CANONICAL_LAYERS.length * data.columns.length);
  const placed = new Map<string, string[]>();
  CANONICAL_LAYERS.forEach((layer, row) => {
    data.columns.forEach((column, index) => {
      const html = cells[row * data.columns.length + index]!;
      const names = [...html.matchAll(/title="([^"·]+) ·/g)].map((m) => m[1]!.trim());
      placed.set(`${layer}:${column.id}`, names);
    });
  });
  return placed;
}

describe("ExploreStackMatrix", () => {
  it("consumes a StackMatrixResponse directly, with a column per column and a row per layer", () => {
    const { data, markup } = render("technology");
    expect(data.columns.length).toBeGreaterThan(0);
    for (const column of data.columns) expect(markup).toContain(column.label);
    for (const layer of CANONICAL_LAYERS) expect(markup, layer).toContain(STACK_LAYER_LABEL[layer]);
    expect(markup).toContain(`--ri-columns:${data.columns.length}`);
  });

  it("places every cell in the column its column_id names, and in no other", () => {
    const { data, markup } = render("technology");
    const placed = cellsByLayerAndColumn(markup, data);

    const expected = new Map<string, string[]>();
    for (const layer of CANONICAL_LAYERS) {
      for (const column of data.columns) expected.set(`${layer}:${column.id}`, []);
    }
    for (const row of data.rows) {
      for (const cell of row.cells) expected.get(`${row.layer}:${cell.column_id}`)!.push(cell.chip.name);
    }

    expect([...expected.values()].flat().length).toBeGreaterThan(0);
    for (const [key, names] of expected) expect(placed.get(key), key).toEqual(names);
  });

  it("renders no unresolved enum identifier under any lens", () => {
    for (const lens of LENSES) {
      const { markup } = render(lens);
      expect(rawEnumTokens(markup), lens).toEqual([]);
    }
  });

  it("says so plainly when a lens has nothing recorded", () => {
    const { data, markup } = render("maturity");
    expect(data.columns).toHaveLength(0);
    expect(visibleText(markup)).toContain("Nothing is recorded under this lens yet.");
  });
});
