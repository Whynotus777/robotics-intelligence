import { describe, expect, it } from "vitest";
import { PREDICATES, PREDICATE_NAMES, STACK_MEMBERSHIP_PREDICATES } from "./predicates.js";
import { validateClaimShape } from "./claim.js";
import { normalizeName } from "./entity.js";
import { ENTITY_TYPES, UNITS } from "./enums.js";

const base = {
  value_text: null,
  value_number: null,
  unit: null,
  is_approximate: false,
  value_min: null,
  value_max: null,
  value_enum: null,
  object_entity_id: null,
  value_date: null,
  stack_layer: null,
  valid_from: "2024-01-01",
  valid_to: null,
} as const;

describe("predicate registry", () => {
  it("is internally consistent", () => {
    for (const name of PREDICATE_NAMES) {
      const def = PREDICATES[name];
      expect(def.subject_types.length, name).toBeGreaterThan(0);
      for (const t of def.subject_types) expect(ENTITY_TYPES).toContain(t);
      if (def.value_kind === "ENTITY") {
        expect(def.object_types?.length, `${name} object_types`).toBeGreaterThan(0);
      } else {
        expect("object_types" in def, `${name} has object_types`).toBe(false);
      }
      if (def.value_kind === "NUMBER") expect(UNITS).toContain(def.unit);
      if (def.value_kind === "ENUM") expect(def.enum_name).toBeDefined();
      if (def.is_stack_membership) expect(def.stack_layer).toBe("REQUIRED");
    }
    expect(STACK_MEMBERSHIP_PREDICATES.sort()).toEqual(["USES_PRODUCT", "USES_TECHNOLOGY"]);
  });

  it("accepts a well-formed numeric claim and rejects the wrong unit", () => {
    expect(validateClaimShape({ ...base, predicate: "HAS_MASS", value_number: 35, unit: "kg" }, "ROBOT", null)).toEqual([]);
    expect(validateClaimShape({ ...base, predicate: "HAS_MASS", value_number: 35, unit: "m" }, "ROBOT", null)).not.toEqual([]);
  });

  it("rejects unknown predicates, wrong subject types, and missing stack layers", () => {
    expect(validateClaimShape({ ...base, predicate: "HAS_WINGS", value_text: "x" }, "ROBOT", null)[0]).toMatch(/unknown/);
    expect(validateClaimShape({ ...base, predicate: "HAS_MASS", value_number: 1, unit: "kg" }, "TASK", null)[0]).toMatch(/subject/);
    expect(
      validateClaimShape(
        { ...base, predicate: "USES_PRODUCT", object_entity_id: "00000000-0000-0000-0000-000000000001" },
        "ROBOT",
        "COMPONENT_PRODUCT",
      )[0],
    ).toMatch(/stack_layer required/);
  });

  it("allows a measure on SCORES_ON only", () => {
    const obj = "00000000-0000-0000-0000-000000000001";
    expect(
      validateClaimShape({ ...base, predicate: "SCORES_ON", object_entity_id: obj, value_number: 0.8, unit: "score" }, "MODEL", "BENCHMARK"),
    ).toEqual([]);
    expect(
      validateClaimShape({ ...base, predicate: "BUILDS", object_entity_id: obj, value_number: 1, unit: "count" }, "ORGANIZATION", "ROBOT"),
    ).not.toEqual([]);
  });
});

describe("normalizeName", () => {
  it("strips case, punctuation and legal suffixes", () => {
    expect(normalizeName("Universal Robots A/S")).toBe("universal robots");
    expect(normalizeName("FANUC Corporation")).toBe("fanuc");
    expect(normalizeName("KUKA AG")).toBe("kuka");
    expect(normalizeName("Figure AI, Inc.")).toBe("figure ai");
  });
});
