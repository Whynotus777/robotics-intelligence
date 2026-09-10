/**
 * The origin the app is served from. Only the sitemap and robots.txt need it —
 * every link in the UI is relative — so it is read here rather than threaded
 * through the pages. Vercel sets the production hostname itself; a self-hosted
 * deployment sets NEXT_PUBLIC_SITE_URL.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}
