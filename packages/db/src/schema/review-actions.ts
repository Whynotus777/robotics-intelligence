import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { claims } from "./claims.js";
import { reviewActionEnum } from "./enums.js";

/** Audit trail for a reviewer decision on a candidate claim. */
export const reviewActions = pgTable(
  "review_actions",
  {
    id: uuid("id").primaryKey(),
    claimId: uuid("claim_id").notNull().references(() => claims.id, { onDelete: "cascade" }),
    reviewer: text("reviewer").notNull(),
    action: reviewActionEnum("action").notNull(),
    actedAt: timestamp("acted_at", { withTimezone: true, mode: "string" }).notNull(),
    resultingClaimId: uuid("resulting_claim_id").references(() => claims.id, { onDelete: "set null" }),
    reason: text("reason"),
  },
  (t) => [index("review_actions_claim_idx").on(t.claimId), index("review_actions_result_idx").on(t.resultingClaimId)],
);
