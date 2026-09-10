import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * What is worth crawling is the record itself: Explore and the entity, market,
 * task and company profiles. Everything else is a view of that record rather
 * than a page about anything, and every one of those views is a query string —
 * a filtered Explore, an Atlas layer, an Updates toggle, a Compare selection.
 * Left open they multiply into thousands of near-duplicate URLs that spend the
 * crawl budget re-reading pages the profiles already say better.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/e/", "/r/", "/m/", "/t/"],
        disallow: [
          // Data endpoints for the palette and the evidence drawer, not pages.
          "/api/",
          // A comparison is a selection, not a document; the profiles it is
          // built from are indexed and say the same things.
          "/compare",
          // Query-string variants of the three faceted screens. The bare path
          // stays crawlable — it is only the facets that combinatorially explode.
          "/?*",
          "/updates?*",
          "/atlas?*",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
