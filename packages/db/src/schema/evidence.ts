import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { claims } from "./claims.js";
import { confidenceEnum, evidenceClassEnum, evidenceStanceEnum, sourceKindEnum } from "./enums.js";

/** Canonical source identity. 0b adds operational fields to this table; do not fork it. */
export const sources = pgTable("sources", {
  id: uuid("id").primaryKey(),
  url: text("url").notNull(),
  canonicalUrl: text("canonical_url"),
  publisher: text("publisher"),
  title: text("title"),
  sourceKind: sourceKindEnum("source_kind").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }),
  language: text("language"),
});

export const evidence = pgTable(
  "evidence",
  {
    id: uuid("id").primaryKey(),
    claimId: uuid("claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "restrict" }),
    evidenceClass: evidenceClassEnum("evidence_class").notNull(),
    confidence: confidenceEnum("confidence").notNull(),
    stance: evidenceStanceEnum("stance").notNull().default("SUPPORTS"),
    excerpt: text("excerpt"),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "string" }),
    observedAt: timestamp("observed_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (t) => [
    index("evidence_claim_idx").on(t.claimId),
    index("evidence_source_idx").on(t.sourceId),
    check("evidence_source_required", sql`${t.evidenceClass} IN ('ANALYST', 'DERIVED') OR ${t.sourceId} IS NOT NULL`),
  ],
);

/** Extension keyed by evidence id; present for every ANALYST evidence row. */
export const assessments = pgTable("assessments", {
  evidenceId: uuid("evidence_id")
    .primaryKey()
    .references(() => evidence.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  rationale: text("rationale").notNull(),
  advanceCriteria: text("advance_criteria").array().notNull().default([]),
  regressCriteria: text("regress_criteria").array().notNull().default([]),
  evidenceConsidered: uuid("evidence_considered").array().notNull().default([]),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }).notNull(),
  notes: text("notes"),
});
