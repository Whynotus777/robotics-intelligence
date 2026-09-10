import "server-only";
import type { EntityResponse } from "@ri/api-contracts";
import { hrefFor } from "@/lib/vocabulary";

/**
 * Every entity that has a page, and the one URL that page lives at.
 *
 * This reads the generated fixtures rather than the DataProvider because there
 * is no "list every entity" route to read: /search caps at fifty results and
 * needs a query or a filter. The fixtures are the set of pages the build ships,
 * so they are the honest answer for a sitemap and for prerendering — and in
 * DATA_PROVIDER=http mode there is nothing to enumerate, so both come back empty
 * rather than guessed.
 */
export type CanonicalEntity = {
  slug: string;
  entityType: string;
  /** The single canonical path; /e/<slug> redirects here for typed entities. */
  href: string;
  lastModified: Date | undefined;
};

let cached: Promise<CanonicalEntity[]> | undefined;

export function canonicalEntities(): Promise<CanonicalEntity[]> {
  cached ??= (async () => {
    if ((process.env.DATA_PROVIDER ?? "fixture") !== "fixture") return [];
    const fixtures = (await import("@ri/fixtures/generated/index.json")).default as unknown as Record<string, unknown>;
    return Object.entries(fixtures)
      .filter(([key]) => key.startsWith("entity/"))
      .map(([, value]) => {
        const response = value as EntityResponse;
        const verified = response.intelligence.last_verified_at ?? response.as_of;
        return {
          slug: response.entity.slug,
          entityType: response.entity.entity_type,
          href: hrefFor(response.entity),
          lastModified: verified ? new Date(verified) : undefined,
        };
      })
      .sort((a, b) => a.href.localeCompare(b.href));
  })();
  return cached;
}

/** The slugs whose canonical page is the given route prefix — what to prerender. */
export async function slugsUnder(prefix: string): Promise<{ slug: string }[]> {
  const entities = await canonicalEntities();
  return entities.filter((entity) => entity.href.startsWith(`${prefix}/`)).map(({ slug }) => ({ slug }));
}
