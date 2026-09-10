import type { MetadataRoute } from "next";
import { canonicalEntities } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";

/**
 * Canonical entity URLs only — one row per entity, at the one path that entity
 * lives at. No directories, no facets, no /e/<slug> aliases for entities whose
 * canonical home is /r, /m or /t: a sitemap that lists a redirect is a sitemap
 * that asks to be crawled twice.
 *
 * lastModified is the claim-level last-verified date where the record has one,
 * so a re-crawl follows the evidence rather than the deploy.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entities = await canonicalEntities();
  return entities.map((entity) => ({
    url: `${base}${entity.href}`,
    lastModified: entity.lastModified,
    changeFrequency: "weekly" as const,
  }));
}
