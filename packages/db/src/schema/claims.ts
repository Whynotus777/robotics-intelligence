import { sql } from "drizzle-orm";
import { boolean, check, date, doublePrecision, index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { entities } from "./entities.js";
import { claimStatusEnum, stackLayerEnum } from "./enums.js";

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").primaryKey(),
    subjectEntityId: uuid("subject_entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    predicate: text("predicate").notNull(),
    // Exactly one primary value column is set (enforced by validation and a CHECK constraint).
    valueText: text("value_text"),
    valueNumber: doublePrecision("value_number"),
    unit: text("unit"),
    isApproximate: boolean("is_approximate").notNull().default(false),
    valueMin: doublePrecision("value_min"),
    valueMax: doublePrecision("value_max"),
    valueEnum: text("value_enum"),
    objectEntityId: uuid("object_entity_id").references(() => entities.id, { onDelete: "restrict" }),
    valueDate: date("value_date", { mode: "string" }),
    stackLayer: stackLayerEnum("stack_layer"),
    status: claimStatusEnum("status").notNull().default("PROPOSED"),
    validFrom: date("valid_from", { mode: "string" }).notNull(),
    validTo: date("valid_to", { mode: "string" }),
    observedAt: timestamp("observed_at", { withTimezone: true, mode: "string" }).notNull(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true, mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [
    index("claims_subject_predicate_idx").on(t.subjectEntityId, t.predicate),
    index("claims_object_idx").on(t.objectEntityId),
    index("claims_predicate_status_idx").on(t.predicate, t.status),
    // Exactly one primary value column. value_number may accompany an object only on measured relationships (registry-validated).
    check(
      "claims_one_primary_value",
      sql`((${t.valueText} IS NOT NULL)::int + (${t.valueEnum} IS NOT NULL)::int + (${t.objectEntityId} IS NOT NULL)::int + (${t.valueDate} IS NOT NULL)::int + ((${t.valueNumber} IS NOT NULL AND ${t.objectEntityId} IS NULL)::int)) = 1`,
    ),
    check("claims_valid_range", sql`${t.validTo} IS NULL OR ${t.validTo} >= ${t.validFrom}`),
    check("claims_min_max", sql`${t.valueMin} IS NULL OR ${t.valueMax} IS NULL OR ${t.valueMin} <= ${t.valueMax}`),
  ],
);

export const claimDependencies = pgTable(
  "claim_dependencies",
  {
    derivedClaimId: uuid("derived_claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "cascade" }),
    inputClaimId: uuid("input_claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.derivedClaimId, t.inputClaimId] })],
);
