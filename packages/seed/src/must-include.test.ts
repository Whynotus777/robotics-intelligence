import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeName } from "@ri/domain";
import { readSeedData } from "./read.js";

// This curated two-column CSV deliberately contains no quoted commas.
const lines = readFileSync(new URL("../../../research/must-include.csv", import.meta.url), "utf8").trim().split(/\r?\n/);
const entities = readSeedData().entities;
const names = new Set(entities.flatMap((e) => [e.name, ...e.aliases]).map(normalizeName));

describe("must-include robotics coverage", () => {
  it("keeps a nonempty, unique name and segment roster", () => {
    expect(lines[0]).toBe("name,segment");
    expect(lines.length).toBeGreaterThan(55);
    const required = lines.slice(1).map((line) => {
      const fields = line.split(",");
      expect(fields).toHaveLength(2);
      expect(fields.every((field) => field.trim().length > 0)).toBe(true);
      return normalizeName(fields[0]!);
    });
    expect(new Set(required).size).toBe(required.length);
  });
  for (const line of lines.slice(1)) {
    const name = line.split(",")[0]!;
    it(`includes ${name} by canonical name or explicit alias`, () => {
      expect(names.has(normalizeName(name)), `Missing required seed entity: ${name}`).toBe(true);
    });
  }
});
