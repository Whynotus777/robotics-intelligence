import { z } from "zod";
import { ChangeEventType } from "./enums.js";

/** Derived read model; the approve/supersede write paths are its sole writers. */
export const ChangeEventRow = z.object({
  id: z.uuid(),
  event_type: ChangeEventType,
  entity_id: z.uuid(),
  before_claim_id: z.uuid().nullable(),
  after_claim_id: z.uuid().nullable(),
  observed_at: z.iso.datetime(),
  summary: z.string().min(1),
});
export type ChangeEventRow = z.infer<typeof ChangeEventRow>;
