import { eq } from "drizzle-orm";
import { entities, entityAliases, externalIds, type Db } from "./index.js";
import { normalizeName } from "@ri/domain";

export { normalizeName } from "@ri/domain";

export interface ResolutionCandidate {
  entity: typeof entities.$inferSelect;
  score: number;
  exact: boolean;
  matchedOn: "name" | "alias";
}

/** Exact normalized name/alias match first; small deterministic fallback ranking, no ML. */
export async function resolveEntity(db: Db, value: string, limit = 10): Promise<ResolutionCandidate[]> {
  const normalized = normalizeName(value);
  const [allEntities, aliases] = await Promise.all([db.select().from(entities), db.select().from(entityAliases)]);
  const aliasByEntity = new Map<string, string[]>();
  for (const alias of aliases) aliasByEntity.set(alias.entityId, [...(aliasByEntity.get(alias.entityId) ?? []), alias.normalized]);
  return allEntities
    .flatMap((entity) => {
      const nameExact = entity.normalizedName === normalized;
      const aliasExact = (aliasByEntity.get(entity.id) ?? []).includes(normalized);
      const haystacks = [entity.normalizedName, ...(aliasByEntity.get(entity.id) ?? [])];
      const overlap = haystacks.some((x) => x.includes(normalized) || normalized.includes(x));
      if (!nameExact && !aliasExact && !overlap) return [];
      return [{ entity, score: nameExact || aliasExact ? 1 : 0.5, exact: nameExact || aliasExact, matchedOn: aliasExact && !nameExact ? "alias" as const : "name" as const }];
    })
    .sort((a, b) => b.score - a.score || a.entity.name.localeCompare(b.entity.name))
    .slice(0, limit);
}

/** Manual, auditable merge. Claims move to the survivor and the old canonical name remains an alias. */
export async function mergeEntities(db: Db, fromEntityId: string, toEntityId: string): Promise<void> {
  if (fromEntityId === toEntityId) throw new Error("cannot merge an entity into itself");
  await db.transaction(async (tx) => {
    const [from] = await tx.select().from(entities).where(eq(entities.id, fromEntityId));
    const [to] = await tx.select().from(entities).where(eq(entities.id, toEntityId));
    if (!from || !to) throw new Error("merge endpoints must exist");
    await tx.insert(entityAliases).values({ entityId: to.id, alias: from.name, normalized: from.normalizedName }).onConflictDoNothing();
    const aliases = await tx.select().from(entityAliases).where(eq(entityAliases.entityId, from.id));
    for (const alias of aliases) await tx.insert(entityAliases).values({ ...alias, entityId: to.id }).onConflictDoNothing();
    const ids = await tx.select().from(externalIds).where(eq(externalIds.entityId, from.id));
    for (const id of ids) await tx.insert(externalIds).values({ ...id, entityId: to.id }).onConflictDoNothing();
    const { claims, changeEvents, places } = await import("./index.js");
    await tx.update(claims).set({ subjectEntityId: to.id }).where(eq(claims.subjectEntityId, from.id));
    await tx.update(claims).set({ objectEntityId: to.id }).where(eq(claims.objectEntityId, from.id));
    await tx.update(changeEvents).set({ entityId: to.id }).where(eq(changeEvents.entityId, from.id));
    await tx.delete(places).where(eq(places.entityId, from.id));
    await tx.delete(entities).where(eq(entities.id, from.id));
  });
}
