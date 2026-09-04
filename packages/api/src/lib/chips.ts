import { eq, inArray } from "drizzle-orm";
import { entities } from "@ri/db";
import type { EntityChip } from "@ri/api-contracts";
import type { ApiContext } from "../context.js";

export type EntityRow = typeof entities.$inferSelect;

export function toChip(e: EntityRow): EntityChip {
  return { id: e.id, slug: e.slug, entity_type: e.entityType, name: e.name, primary_embodiment: e.primaryEmbodiment };
}

export async function entityBySlug(ctx: ApiContext, slug: string): Promise<EntityRow | null> {
  const [row] = await ctx.db.select().from(entities).where(eq(entities.slug, slug));
  return row ?? null;
}

export async function entitiesByIds(ctx: ApiContext, ids: Iterable<string>): Promise<Map<string, EntityRow>> {
  const list = [...new Set(ids)];
  if (list.length === 0) return new Map();
  const rows = await ctx.db.select().from(entities).where(inArray(entities.id, list));
  return new Map(rows.map((r) => [r.id, r]));
}

export async function entitiesByType(ctx: ApiContext, type: EntityRow["entityType"]): Promise<EntityRow[]> {
  return ctx.db.select().from(entities).where(eq(entities.entityType, type)).orderBy(entities.name);
}

/** Deterministic ordering for chips: by name, then slug. */
export function byName<T extends { name: string; slug: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug);
}

export function uniqueChips(chips: EntityChip[]): EntityChip[] {
  const seen = new Set<string>();
  return chips.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true))).sort(byName);
}
