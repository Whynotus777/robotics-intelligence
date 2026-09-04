import { NextResponse } from "next/server";
import { DiscoveryFilters } from "@ri/api-contracts";
import { data } from "@/lib/data";

/** Backs the ⌘K palette. Same DataProvider as every screen — no second data path. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = DiscoveryFilters.safeParse(Object.fromEntries(params));
  const query = params.get("q") ?? undefined;
  const filters = parsed.success ? parsed.data : {};
  if (!query && Object.keys(filters).length === 0) return NextResponse.json({ query: "", results: [] });

  const provider = await data();
  const response = await provider.search(query, { ...filters, limit: 12 });
  return NextResponse.json(response);
}
