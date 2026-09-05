import { describe, expect, it } from "vitest";
import { eventSummary } from "./events.js";

const robot = { name: "Unitree G1", entityType: "ROBOT" };
const task = { name: "Blade repair", entityType: "TASK" };
const deployment = { name: "Figure humanoids at BMW Spartanburg", entityType: "DEPLOYMENT" };

describe("eventSummary", () => {
  it("states a first enum value", () => {
    expect(eventSummary({ subject: robot, after: { predicate: "HAS_EMBODIMENT", valueEnum: "QUADRUPED" } }))
      .toBe("Embodiment set to Quadruped");
  });

  it("moves an enum that has a prior value", () => {
    expect(eventSummary({
      subject: robot,
      after: { predicate: "HAS_COMMERCIAL_STAGE", valueEnum: "COMMERCIAL" },
      before: { predicate: "HAS_COMMERCIAL_STAGE", valueEnum: "COMMERCIAL" },
    })).toBe("Commercial stage moved to Commercial");
  });

  it("says which way an ordinal scale went", () => {
    expect(eventSummary({
      subject: task,
      after: { predicate: "HAS_MATURITY", valueEnum: "SCALING" },
      before: { predicate: "HAS_MATURITY", valueEnum: "PILOT" },
    })).toBe("Maturity raised to Scaling");
    expect(eventSummary({
      subject: task,
      after: { predicate: "HAS_MATURITY", valueEnum: "PILOT" },
      before: { predicate: "HAS_MATURITY", valueEnum: "SCALING" },
    })).toBe("Maturity lowered to Pilot");
  });

  it("shows both sides of a number that changed", () => {
    expect(eventSummary({
      subject: robot,
      after: { predicate: "HAS_LIST_PRICE", valueNumber: 16000, unit: "USD" },
      before: { predicate: "HAS_LIST_PRICE", valueNumber: 20000, unit: "USD" },
    })).toBe("List price changed from $20,000 to $16,000");
  });

  it("keeps the approximation marker and the unit", () => {
    expect(eventSummary({ subject: robot, after: { predicate: "HAS_MASS", valueNumber: 35, unit: "kg", isApproximate: true } }))
      .toBe("Mass set to ~35 kg");
    expect(eventSummary({ subject: robot, after: { predicate: "HAS_RUNTIME", valueNumber: 7200, unit: "s", isApproximate: true } }))
      .toBe("Runtime set to ~2 h");
  });

  it("names the place a deployment happened at", () => {
    expect(eventSummary({ subject: deployment, after: { predicate: "OCCURS_AT", objectName: "BMW Spartanburg" } }))
      .toBe("Deployment added at BMW Spartanburg");
    expect(eventSummary({ subject: deployment, after: { predicate: "USES_ROBOT", objectName: "Figure 02" } }))
      .toBe("Deployment added using Figure 02");
    expect(eventSummary({ subject: deployment, after: { predicate: "OPERATED_BY", objectName: "GXO" } }))
      .toBe("Deployment added, operated by GXO");
  });

  it("reads a relationship as the verb its registry label already is", () => {
    expect(eventSummary({ subject: robot, after: { predicate: "COMPETES_WITH", objectName: "Figure 03" } }))
      .toBe("Competes with Figure 03");
    expect(eventSummary({ subject: robot, after: { predicate: "USES_PRODUCT", objectName: "NVIDIA Jetson Orin NX" } }))
      .toBe("Uses NVIDIA Jetson Orin NX");
    // The copula goes: "is headquartered at" would not start a sentence well.
    expect(eventSummary({ subject: robot, after: { predicate: "HQ_AT", objectName: "Hangzhou" } }))
      .toBe("Headquartered at Hangzhou");
  });

  it("carries the text of a text claim, which nothing else on the page shows", () => {
    expect(eventSummary({ subject: task, after: { predicate: "HAS_ADOPTION_BLOCKER", valueText: "Brownfield integration." } }))
      .toBe("Adoption blocker recorded: Brownfield integration.");
    expect(eventSummary({
      subject: task,
      after: { predicate: "HAS_ADOPTION_BLOCKER", valueText: "Safety certification." },
      before: { predicate: "HAS_ADOPTION_BLOCKER", valueText: "Brownfield integration." },
    })).toBe("Adoption blocker updated: Safety certification.");
  });

  it("writes a date as words", () => {
    expect(eventSummary({ subject: robot, after: { predicate: "ANNOUNCED_ON", valueDate: "2024-05-13" } }))
      .toBe("Announced on 13 May 2024");
  });

  it("never echoes a predicate name or an enum identifier", () => {
    const summaries = [
      eventSummary({ subject: robot, after: { predicate: "HAS_EMBODIMENT", valueEnum: "AUTONOMOUS_VEHICLE" } }),
      eventSummary({ subject: task, after: { predicate: "HAS_MATURITY", valueEnum: "EARLY_COMMERCIAL" } }),
      eventSummary({ subject: robot, after: { predicate: "HAS_ARCHITECTURE_NOTE", valueText: "A note." } }),
      eventSummary({ subject: task, after: { predicate: "USES_EMBODIMENT", valueEnum: "OTHER_MOBILE" } }),
    ];
    for (const summary of summaries) expect(summary).not.toMatch(/[A-Z][A-Z0-9]*_[A-Z0-9_]+/);
    expect(summaries[0]).toBe("Embodiment set to Autonomous vehicle");
    expect(summaries[1]).toBe("Maturity set to Early commercial");
  });
});
