import { sql } from "drizzle-orm";
import { boolean, char, customType, doublePrecision, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { commercialStageEnum, depthTierEnum, embodimentEnum, entityTypeEnum, maturityEnum } from "./enums.js";

const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });

export const entities = pgTable(
  "entities",
  {
    id: uuid("id").primaryKey(),
    slug: text("slug").notNull(),
    entityType: entityTypeEnum("entity_type").notNull(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    shortDescription: text("short_description"),
    imageUrl: text("image_url"),
    imageCredit: text("image_credit"),
    primaryEmbodiment: embodimentEnum("primary_embodiment"),
    countryCode: char("country_code", { length: 2 }),
    depthTier: depthTierEnum("depth_tier").notNull().default("STANDARD"),
    // Cached current values: derived from APPROVED open claims by recompute; never written directly.
    commercialStage: commercialStageEnum("commercial_stage"),
    heightM: doublePrecision("height_m"),
    massKg: doublePrecision("mass_kg"),
    payloadKg: doublePrecision("payload_kg"),
    listPriceUsd: doublePrecision("list_price_usd"),
    maturity: maturityEnum("maturity"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    // Full-text search document (name weighted A, description C). Aliases are searched by trigram.
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce("name", '')), 'A') || setweight(to_tsvector('english', coalesce("short_description", '')), 'C')`,
    ),
  },
  (t) => [
    uniqueIndex("entities_slug_idx").on(t.slug),
    index("entities_type_idx").on(t.entityType),
    index("entities_normalized_name_idx").on(t.normalizedName),
    index("entities_search_vector_idx").using("gin", t.searchVector),
    index("entities_name_trgm_idx").using("gin", sql`${t.name} gin_trgm_ops`),
  ],
);

export const entityAliases = pgTable(
  "entity_aliases",
  {
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    normalized: text("normalized").notNull(),
  },
  (t) => [
    uniqueIndex("entity_aliases_pk").on(t.entityId, t.normalized),
    index("entity_aliases_normalized_idx").on(t.normalized),
    index("entity_aliases_alias_trgm_idx").using("gin", sql`${t.alias} gin_trgm_ops`),
  ],
);

/** Stable foreign identifiers supplied by data sources; no ML resolution is implied. */
export const externalIds = pgTable(
  "external_ids",
  {
    entityId: uuid("entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
    system: text("system").notNull(),
    externalId: text("external_id").notNull(),
  },
  (t) => [uniqueIndex("external_ids_system_id_idx").on(t.system, t.externalId), index("external_ids_entity_idx").on(t.entityId)],
);

/** PLACE extension. */
export const places = pgTable("places", {
  entityId: uuid("entity_id")
    .primaryKey()
    .references(() => entities.id, { onDelete: "cascade" }),
  adminRegion: text("admin_region"),
  city: text("city"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  clusterLabel: text("cluster_label"),
});

export const embodimentLayerLabels = pgTable(
  "embodiment_layer_labels",
  {
    embodiment: embodimentEnum("embodiment").notNull(),
    layer: text("layer").notNull(),
    label: text("label").notNull(),
    applies: boolean("applies").notNull().default(true),
  },
  (t) => [uniqueIndex("embodiment_layer_labels_pk").on(t.embodiment, t.layer)],
);
