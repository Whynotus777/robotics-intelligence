import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { sourceSnapshots, sources, type Db } from "@ri/db";

export const FETCH_USER_AGENT = "robotics-intelligence/0.1 (+https://github.com/Whynotus777/robotics-intelligence)";
export type RefreshCadence = "DAILY" | "WEEKLY" | "MONTHLY" | "MANUAL" | "NEVER";
export type FetchSource = typeof sources.$inferSelect;

export interface SnapshotStore {
  put(sourceId: string, contentHash: string, body: Uint8Array): Promise<string>;
}

export class FileSnapshotStore implements SnapshotStore {
  constructor(private readonly root = process.env.SNAPSHOT_DIR ?? ".data/source-snapshots") {}

  async put(sourceId: string, contentHash: string, body: Uint8Array): Promise<string> {
    const directory = path.resolve(this.root, sourceId);
    const destination = path.join(directory, `${contentHash}.bin`);
    await mkdir(directory, { recursive: true });
    await writeFile(destination, body, { flag: "wx" }).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "EEXIST") throw error;
    });
    return `file://${destination}`;
  }
}

export function contentHash(body: Uint8Array): string {
  return createHash("sha256").update(body).digest("hex");
}

export function nextCheckAt(fetchedAt: string, cadence: RefreshCadence): string | null {
  if (cadence === "MANUAL" || cadence === "NEVER") return null;
  const next = new Date(fetchedAt);
  if (cadence === "DAILY") next.setUTCDate(next.getUTCDate() + 1);
  if (cadence === "WEEKLY") next.setUTCDate(next.getUTCDate() + 7);
  if (cadence === "MONTHLY") {
    const day = next.getUTCDate();
    next.setUTCDate(1);
    next.setUTCMonth(next.getUTCMonth() + 1);
    const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
    next.setUTCDate(Math.min(day, lastDay));
  }
  return next.toISOString();
}

function matchingRobotsGroup(robots: string, agent: string): string[] {
  const groups: Array<{ agents: string[]; rules: string[] }> = [];
  let group: { agents: string[]; rules: string[] } | undefined;
  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === "user-agent") {
      if (!group || group.rules.length) groups.push(group = { agents: [], rules: [] });
      group.agents.push(value.toLowerCase());
    } else if (group && (field === "allow" || field === "disallow")) {
      group.rules.push(`${field}:${value}`);
    }
  }
  const lowerAgent = agent.toLowerCase();
  const exact = groups.filter((item) => item.agents.some((name) => name !== "*" && lowerAgent.includes(name)));
  return (exact.length ? exact : groups.filter((item) => item.agents.includes("*"))).flatMap((item) => item.rules);
}

export function robotsAllows(robots: string, target: URL, agent = FETCH_USER_AGENT): boolean {
  const pathname = `${target.pathname}${target.search}`;
  const matches = matchingRobotsGroup(robots, agent)
    .map((rule) => {
      const [kind, ...parts] = rule.split(":");
      return { allow: kind === "allow", pattern: parts.join(":") };
    })
    .filter(({ pattern }) => pattern && pathname.startsWith(pattern))
    .sort((a, b) => b.pattern.length - a.pattern.length);
  return matches[0]?.allow ?? true;
}

export class PoliteFetcher {
  private readonly lastRequest = new Map<string, number>();
  private readonly robots = new Map<string, Promise<string>>();

  constructor(private readonly fetchImpl: typeof fetch = fetch, private readonly perHostDelayMs = 1_000, private readonly userAgent = FETCH_USER_AGENT) {}

  private async waitForHost(origin: string): Promise<void> {
    const delay = Math.max(0, (this.lastRequest.get(origin) ?? 0) + this.perHostDelayMs - Date.now());
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    this.lastRequest.set(origin, Date.now());
  }

  private async request(url: string): Promise<Response> {
    const origin = new URL(url).origin;
    await this.waitForHost(origin);
    return this.fetchImpl(url, { headers: { "user-agent": this.userAgent }, redirect: "follow" });
  }

  async fetch(url: string): Promise<Uint8Array> {
    const target = new URL(url);
    let robots = this.robots.get(target.origin);
    if (!robots) {
      robots = this.request(new URL("/robots.txt", target.origin).href).then((response) => response.ok ? response.text() : "").catch(() => "");
      this.robots.set(target.origin, robots);
    }
    if (!robotsAllows(await robots, target, this.userAgent)) throw new Error(`robots.txt disallows ${url}`);
    const response = await this.request(url);
    if (!response.ok) throw new Error(`fetch ${url} failed: ${response.status} ${response.statusText}`);
    return new Uint8Array(await response.arrayBuffer());
  }
}

export async function recordFetch(db: Db, source: FetchSource, fetchedAt: string, hash: string, snapshotPointer: string): Promise<{ snapshotId: string; changed: boolean }> {
  const snapshotId = randomUUID();
  const changed = source.contentHash !== hash;
  await db.transaction(async (tx) => {
    await tx.insert(sourceSnapshots).values({ id: snapshotId, sourceId: source.id, fetchedAt, contentHash: hash, snapshotPointer });
    await tx.update(sources).set({ fetchedAt, contentHash: hash, latestSnapshotId: snapshotId, nextCheckAt: nextCheckAt(fetchedAt, source.refreshCadence), ...(changed ? { extractionStatus: "PENDING" as const } : {}) }).where(eq(sources.id, source.id));
  });
  return { snapshotId, changed };
}

export async function fetchSource(db: Db, source: FetchSource, politeFetcher: PoliteFetcher, store: SnapshotStore, now = new Date()): Promise<{ snapshotId: string; changed: boolean }> {
  const body = await politeFetcher.fetch(source.url);
  const hash = contentHash(body);
  const pointer = source.licensePolicy === "LINK_ONLY" ? `link-only://${source.id}/${hash}` : await store.put(source.id, hash, body);
  return recordFetch(db, source, now.toISOString(), hash, pointer);
}

/** Hash gate used by workers: unchanged content stops before extract/resolve/propose. */
export function shouldProcessFetchedContent(previousHash: string | null, incomingHash: string): boolean {
  return previousHash !== incomingHash;
}
