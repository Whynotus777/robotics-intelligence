/** Runnable contract examples. `pnpm queries` runs these against the local seeded DB. */
import { createDb } from "@ri/db";
import { context } from "./context.js";
import { claimEvidenceHandler, compareHandler, entityHandler, marketHandler, searchHandler, stackHandler, taskHandler, updatesHandler } from "./handlers.js";

const { db, close } = createDb();
const ctx = context(db);
const examples: Record<string, () => Promise<unknown>> = {
  "all humanoids": () => searchHandler(ctx, { q: "humanoid" }),
  "robots using NVIDIA compute": () => searchHandler(ctx, { q: "NVIDIA" }),
  "tasks in Wind with maturity": () => marketHandler(ctx, { params: { slug: "wind" } }),
  "organizations targeting pallet movement": () => taskHandler(ctx, { params: { slug: "pallet-movement" } }),
  "deployments for an organization": () => entityHandler(ctx, { params: { slug: "gxo" } }),
  "evidence for a claim": async () => { const e = await entityHandler(ctx, { params: { slug: "unitree-g1" } }); const id = e.claims[0]?.claims[0]?.claim_id; if (!id) throw new Error("Unitree G1 has no claim"); return claimEvidenceHandler(ctx, { params: { id } }); },
  "changes in the last 7 days": () => updatesHandler(ctx, { since: "2026-08-25" }),
  "MRI for Unitree G1": () => stackHandler(ctx, { params: { slug: "unitree-g1" } }),
  "robots sharing a stack technology": () => entityHandler(ctx, { params: { slug: "unitree-g1" } }),
  "Compare G1 / Apollo / Figure 03": () => compareHandler(ctx, { slugs: ["unitree-g1", "apptronik-apollo", "figure-03"] }),
};
try { for (const [name, query] of Object.entries(examples)) console.log(`\n${name}\n`, JSON.stringify(await query(), null, 2)); } finally { await close(); }
