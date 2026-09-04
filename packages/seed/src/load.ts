import { createDb } from "@ri/db";
import { buildRows } from "./build.js";
import { insertRows } from "./insert.js";
import { readSeedData } from "./read.js";

const input = readSeedData();
const rows = buildRows(input);
const { db, close } = createDb();
try {
  await insertRows(db, rows);
  const evidenceByClass = rows.evidence.reduce<Record<string, number>>((acc, e) => {
    acc[e.evidenceClass] = (acc[e.evidenceClass] ?? 0) + 1;
    return acc;
  }, {});
  console.log("seeded", {
    entities: rows.entities.length,
    claims: rows.claims.length,
    relationships: rows.claims.filter((c) => c.objectEntityId).length,
    evidence: rows.evidence.length,
    evidenceByClass,
    assessments: rows.assessments.length,
    sources: rows.sources.length,
    changeEvents: rows.changeEvents.length,
    layerLabels: rows.layerLabels.length,
  });
} finally {
  await close();
}
