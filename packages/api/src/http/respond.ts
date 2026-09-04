import type { Context } from "hono";

export async function json(c: Context, operation: () => Promise<unknown>) {
  return c.json(await operation());
}
