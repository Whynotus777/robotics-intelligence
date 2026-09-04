import { z } from "zod";
import { CommercialStage, DepthTier, Embodiment, EntityType, Maturity } from "./enums.js";

export const Slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case");

export const CountryCode = z.string().regex(/^[A-Z]{2}$/, "ISO 3166-1 alpha-2");

/** The typed core every entity has. Everything substantive is a claim. */
export const EntityCore = z.object({
  id: z.uuid(),
  slug: Slug,
  entity_type: EntityType,
  name: z.string().min(1).max(200),
  short_description: z.string().max(600).nullable(),
  primary_embodiment: Embodiment.nullable(),
  country_code: CountryCode.nullable(),
  depth_tier: DepthTier,
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});
export type EntityCore = z.infer<typeof EntityCore>;

/**
 * Cached current values, derived from APPROVED open claims by the recompute job.
 * Never written directly. For filtering and sorting only.
 */
export const EntityCachedValues = z.object({
  commercial_stage: CommercialStage.nullable(),
  height_m: z.number().nullable(),
  mass_kg: z.number().nullable(),
  payload_kg: z.number().nullable(),
  list_price_usd: z.number().nullable(),
  maturity: Maturity.nullable(),
});
export type EntityCachedValues = z.infer<typeof EntityCachedValues>;

/** PLACE extension row. Plain lat/lng; no PostGIS. */
export const PlaceDetails = z.object({
  entity_id: z.uuid(),
  admin_region: z.string().nullable(),
  city: z.string().nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  cluster_label: z.string().nullable(),
});
export type PlaceDetails = z.infer<typeof PlaceDetails>;

export const EntityAlias = z.object({
  entity_id: z.uuid(),
  alias: z.string().min(1),
  normalized: z.string().min(1),
});
export type EntityAlias = z.infer<typeof EntityAlias>;

const LEGAL_SUFFIXES = [
  "inc",
  "inc.",
  "corp",
  "corp.",
  "corporation",
  "co",
  "co.",
  "ltd",
  "ltd.",
  "llc",
  "gmbh",
  "ag",
  "a/s",
  "as",
  "sa",
  "s.a.",
  "plc",
  "kk",
  "k.k.",
  "co. ltd.",
  "co., ltd.",
];

/** Case, punctuation, and legal-suffix normalization used for alias matching and uniqueness. */
export function normalizeName(name: string): string {
  let n = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  n = n.replace(/[^a-z0-9/.& ]+/g, " ").replace(/\s+/g, " ").trim();
  for (const suffix of LEGAL_SUFFIXES.sort((a, b) => b.length - a.length)) {
    if (n.endsWith(" " + suffix)) {
      n = n.slice(0, -(suffix.length + 1)).trim();
      break;
    }
  }
  return n.replace(/[./]/g, "").replace(/\s+/g, " ").trim();
}
