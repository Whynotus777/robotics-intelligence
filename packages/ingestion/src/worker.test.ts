import { describe, expect, it } from "vitest";
import { shouldProcessFetchedContent } from "./worker.js";

describe("ingestion worker hash gate", () => {
  it("does no extraction work for an unchanged hash", () => {
    expect(shouldProcessFetchedContent("abc", "abc")).toBe(false);
    expect(shouldProcessFetchedContent("abc", "def")).toBe(true);
  });
});
