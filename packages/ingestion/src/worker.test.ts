import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, sourceSnapshots, sources } from "@ri/db";
import { nextCheckAt, recordFetch, robotsAllows, shouldProcessFetchedContent } from "./worker.js";

const { db, close } = createDb();
afterAll(async () => close());

describe("ingestion worker hash gate", () => {
  it("does no extraction work for an unchanged hash", () => {
    expect(shouldProcessFetchedContent("abc", "abc")).toBe(false);
    expect(shouldProcessFetchedContent("abc", "def")).toBe(true);
  });
});

describe("fetch persistence", () => {
  it("leaves extraction status unchanged for an unchanged hash and sets PENDING for a changed hash", async () => {
    const id = randomUUID();
    await db.insert(sources).values({ id, url: "https://example.test/source", sourceKind: "OTHER", contentHash: "same", extractionStatus: "EXTRACTED", refreshCadence: "DAILY" });
    try {
      const source = (await db.select().from(sources).where(eq(sources.id, id)))[0]!;
      expect((await recordFetch(db, source, "2026-09-04T12:00:00.000Z", "same", "test://same")).changed).toBe(false);
      expect((await db.select().from(sources).where(eq(sources.id, id)))[0]!.extractionStatus).toBe("EXTRACTED");
      const refreshed = (await db.select().from(sources).where(eq(sources.id, id)))[0]!;
      expect((await recordFetch(db, refreshed, "2026-09-05T12:00:00.000Z", "different", "test://different")).changed).toBe(true);
      expect((await db.select().from(sources).where(eq(sources.id, id)))[0]!.extractionStatus).toBe("PENDING");
    } finally {
      await db.update(sources).set({ latestSnapshotId: null }).where(eq(sources.id, id));
      await db.delete(sourceSnapshots).where(eq(sourceSnapshots.sourceId, id));
      await db.delete(sources).where(eq(sources.id, id));
    }
  });
});

describe("cadence math", () => {
  it.each([
    ["DAILY", "2026-02-01T10:30:00.000Z"],
    ["WEEKLY", "2026-02-07T10:30:00.000Z"],
    ["MONTHLY", "2026-02-28T10:30:00.000Z"],
    ["MANUAL", null],
    ["NEVER", null],
  ] as const)("computes %s", (cadence, expected) => {
    expect(nextCheckAt("2026-01-31T10:30:00.000Z", cadence)).toBe(expected);
  });
});

describe("robots.txt", () => {
  it("honors the longest matching allow/disallow rule", () => {
    const robots = "User-agent: *\nDisallow: /private\nAllow: /private/public";
    expect(robotsAllows(robots, new URL("https://example.test/private/file"))).toBe(false);
    expect(robotsAllows(robots, new URL("https://example.test/private/public/file"))).toBe(true);
  });
});
