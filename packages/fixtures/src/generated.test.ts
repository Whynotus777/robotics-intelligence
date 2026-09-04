import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AtlasResponse, ClaimEvidenceResponse, CompareResponse, EntityResponse, ExploreResponse, MarketResponse, SearchResponse,
  StackResponse, TaskResponse, UpdatesResponse,
} from "@ri/api-contracts";

const dir = new URL("../generated/", import.meta.url).pathname;
const fixtures = JSON.parse(readFileSync(join(dir, "index.json"), "utf8")) as Record<string, unknown>;

describe("generated fixtures", () => {
  it("parses every checked-in response through its route contract", () => {
    for (const [key, fixture] of Object.entries(fixtures)) {
      const schema = key.startsWith("entity/") ? EntityResponse : key.startsWith("search/") ? SearchResponse : key.startsWith("explore/") ? ExploreResponse : key.startsWith("stack/") ? StackResponse : key.startsWith("task/") ? TaskResponse : key.startsWith("market/") ? MarketResponse : key.startsWith("compare/") ? CompareResponse : key.startsWith("atlas/") ? AtlasResponse : key === "updates" ? UpdatesResponse : key.startsWith("claim/") ? ClaimEvidenceResponse : null;
      expect(schema, `unknown fixture key ${key}`).not.toBeNull();
      expect(() => schema!.parse(fixture), key).not.toThrow();
    }
  });
});
