import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { SeedEntity, SeedLayerLabels, SeedSource } from "./schema.js";
import type { z } from "zod";

export const DATA_DIR = new URL("../data/", import.meta.url).pathname;

function yamlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...yamlFiles(full));
    else if (name.endsWith(".yaml") || name.endsWith(".yml")) out.push(full);
  }
  return out;
}

function parseFile<T extends z.ZodTypeAny>(file: string, schema: T): z.infer<T> {
  const parsed = schema.safeParse(parse(readFileSync(file, "utf8")));
  if (!parsed.success) {
    throw new Error(`${file}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  return parsed.data;
}

export interface SeedInput {
  entities: z.infer<typeof SeedEntity>[];
  sources: z.infer<typeof SeedSource>[];
  layerLabels: z.infer<typeof SeedLayerLabels>;
}

export function readSeedData(dataDir: string = DATA_DIR): SeedInput {
  const entities = yamlFiles(join(dataDir, "entities")).map((f) => parseFile(f, SeedEntity));
  const sources = yamlFiles(join(dataDir, "sources")).flatMap((f) => parseFile(f, SeedSource.array()));
  const layerLabels = parseFile(join(dataDir, "embodiment-layer-labels.yaml"), SeedLayerLabels);
  return { entities, sources, layerLabels };
}
