import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { claims } from "./claims.js";
import { entities } from "./entities.js";
import { changeEventTypeEnum } from "./enums.js";

export const changeEvents = pgTable(
  "change_events",
  {
    id: uuid("id").primaryKey(),
    eventType: changeEventTypeEnum("event_type").notNull(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    beforeClaimId: uuid("before_claim_id").references(() => claims.id, { onDelete: "set null" }),
    afterClaimId: uuid("after_claim_id").references(() => claims.id, { onDelete: "set null" }),
    observedAt: timestamp("observed_at", { withTimezone: true, mode: "string" }).notNull(),
    summary: text("summary").notNull(),
  },
  (t) => [index("change_events_observed_idx").on(t.observedAt), index("change_events_entity_idx").on(t.entityId)],
);
