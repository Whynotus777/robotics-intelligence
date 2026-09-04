import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@ri/db";
import { context } from "../context.js";
import { createApp } from "./app.js";

const fixtureUrl = new URL("../../../fixtures/generated/index.json", import.meta.url);
const fixtures = JSON.parse(readFileSync(fixtureUrl, "utf8")) as Record<string, unknown>;

function requestFor(key: string, fixture: unknown): Request {
  const parts = key.split("/");
  const value = fixture as { columns?: Array<{ slug: string }> };
  switch (parts[0]) {
    case "entity": return new Request(`http://test/entities/${encodeURIComponent(parts[1]!)}`);
    case "search": return new Request(`http://test/search?q=${encodeURIComponent(parts[1]!)}`);
    case "explore": return new Request(`http://test/explore?lens=${parts[1]}&measure=${parts[2]}`);
    case "stack-matrix": return new Request(`http://test/explore/stack-matrix?lens=${parts[1]}`);
    case "stack": return new Request(`http://test/robots/${encodeURIComponent(parts[1]!)}/stack`);
    case "task": return new Request(`http://test/tasks/${encodeURIComponent(parts[1]!)}`);
    case "market": return new Request(`http://test/markets/${encodeURIComponent(parts[1]!)}`);
    case "compare": return new Request("http://test/compare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slugs: value.columns?.map(({ slug }) => slug) ?? [] }),
    });
    case "atlas": return new Request(`http://test/atlas?layer=${parts[1]}`);
    case "updates": return new Request("http://test/updates");
    case "claim": return new Request(`http://test/claims/${encodeURIComponent(parts[1]!)}/evidence`);
    default: throw new Error(`unmapped fixture request: ${key}`);
  }
}

describe("HTTP contract fixtures", () => {
  let close: () => Promise<void>;
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    const connection = createDb();
    close = connection.close;
    app = createApp(context(connection.db as Db));
  });
  afterAll(async () => close());

  it("replays every generated fixture through HTTP without drift", async () => {
    for (const [key, expected] of Object.entries(fixtures)) {
      const response = await app.fetch(requestFor(key, expected));
      expect(response.status, key).toBe(200);
      const actual = await response.json();
      expect(JSON.stringify(actual), key).toBe(JSON.stringify(expected));
    }
  }, 120_000);

  it("serves structured humanoid filters and rejects an empty search", async () => {
    const robots = await app.request("/robots?embodiment=HUMANOID");
    expect(robots.status).toBe(200);
    expect((await robots.json() as { robots: Array<{ primary_embodiment: string | null }> }).robots.every(({ primary_embodiment }) => primary_embodiment === "HUMANOID")).toBe(true);

    const search = await app.request("/search?entity_type=ROBOT&embodiment=HUMANOID");
    expect(search.status).toBe(200);
    expect((await search.json() as { results: unknown[] }).results.length).toBeGreaterThan(0);
    expect((await app.request("/search")).status).toBe(400);
  });
});
