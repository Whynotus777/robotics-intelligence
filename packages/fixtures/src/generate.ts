import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createDb, claims } from "@ri/db";
import {
  atlasHandler, claimEvidenceHandler, compareHandler, context, entityHandler, exploreHandler, marketHandler, searchHandler, stackHandler,
  stackMatrixHandler, taskHandler, updatesHandler,
} from "@ri/api";

const dir = new URL("../generated/", import.meta.url).pathname;
const { db, close } = createDb();
const ctx = context(db);
const output: Record<string, unknown> = {};
const put = (key: string, value: unknown) => { output[key] = value; writeFileSync(join(dir, `${key.replaceAll("/", "__")}.json`), `${JSON.stringify(value, null, 2)}\n`); };
try {
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const entitySlugs = (await db.select({ slug: (await import("@ri/db")).entities.slug }).from((await import("@ri/db")).entities)).map(x => x.slug).sort();
  for (const slug of entitySlugs) put(`entity/${slug}`, await entityHandler(ctx, { params: { slug } }));
  for (const slug of entitySlugs) {
    const entity = await entityHandler(ctx, { params: { slug } });
    if (entity.entity.entity_type === "ROBOT") put(`stack/${slug}`, await stackHandler(ctx, { params: { slug } }));
    if (entity.entity.entity_type === "TASK") put(`task/${slug}`, await taskHandler(ctx, { params: { slug } }));
    if (entity.entity.entity_type === "MARKET") put(`market/${slug}`, await marketHandler(ctx, { params: { slug } }));
  }
  for (const q of ["unitree", "wind", "pallet", "nvidia"]) put(`search/${q}`, await searchHandler(ctx, { q }));
  for (const lens of ["embodiment", "market", "technology", "geography", "maturity"] as const) put(`explore/${lens}/none`, await exploreHandler(ctx, { lens, measure: "none" }));
  for (const lens of ["embodiment", "market", "technology", "geography", "maturity"] as const) put(`stack-matrix/${lens}`, await stackMatrixHandler(ctx, { lens }));
  put("compare/unitree-g1-apptronik-apollo-figure-03", await compareHandler(ctx, { slugs: ["unitree-g1", "apptronik-apollo", "figure-03"] }));
  for (const layer of ["hq", "rnd", "manufacturing", "deployments", "research"] as const) put(`atlas/${layer}`, await atlasHandler(ctx, { layer }));
  // Two payloads: the feed as it is read by default, and the same feed with the
  // seeded initial load included, which is what the "Show initial data load"
  // toggle asks for.
  put("updates", await updatesHandler(ctx, {}));
  put("updates/all", await updatesHandler(ctx, { include_seed: true }));
  const currentClaims = (await db.select({ id: claims.id }).from(claims)).sort((a,b)=>a.id.localeCompare(b.id));
  for (const c of currentClaims) put(`claim/${c.id}`, await claimEvidenceHandler(ctx, { params: { id: c.id } }));
  writeFileSync(join(dir, "index.json"), `${JSON.stringify(output, null, 2)}\n`);
  console.log(`generated ${Object.keys(output).length} validated fixtures in ${dir}`);
} finally { await close(); }
