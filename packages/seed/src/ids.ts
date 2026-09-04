import { createHash } from "node:crypto";

/**
 * Deterministic ids so that re-seeding produces identical rows and fixtures.
 * A SHA-1 of a namespaced key, laid out as a version-5-style UUID.
 */
export function deterministicId(namespace: string, key: string): string {
  const h = createHash("sha1").update(`${namespace}:${key}`).digest("hex");
  const hex = h.slice(0, 12) + "5" + h.slice(13, 16) + ((parseInt(h[16]!, 16) & 0x3) | 0x8).toString(16) + h.slice(17, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export const entityId = (slug: string) => deterministicId("entity", slug);
export const claimId = (slug: string, key: string) => deterministicId("claim", `${slug}:${key}`);
export const evidenceId = (slug: string, key: string, index: number) => deterministicId("evidence", `${slug}:${key}:${index}`);
export const sourceId = (key: string) => deterministicId("source", key);
export const changeEventId = (key: string) => deterministicId("change-event", key);
