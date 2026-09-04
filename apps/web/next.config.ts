import { join } from "node:path";
import type { NextConfig } from "next";

/**
 * The app is one workspace package inside a pnpm monorepo: the @ri/* packages ship
 * TypeScript sources, so Next compiles them, and file tracing has to start at the
 * repo root or the Vercel build misses the linked packages.
 */
const nextConfig: NextConfig = {
  outputFileTracingRoot: join(import.meta.dirname, "../.."),
  transpilePackages: ["@ri/api-contracts", "@ri/domain", "@ri/fixtures", "@ri/viz"],
  typedRoutes: false,
  experimental: { optimizePackageImports: ["geist"] },
  /**
   * The workspace packages are ESM TypeScript and import each other with explicit
   * .js specifiers, so the bundler has to try the TypeScript source for them.
   */
  webpack(config) {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
