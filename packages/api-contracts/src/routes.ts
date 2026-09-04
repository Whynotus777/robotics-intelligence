import type { z } from "zod";
import { AtlasQuery, AtlasResponse } from "./routes/atlas.js";
import { ClaimEvidenceParams, ClaimEvidenceResponse } from "./routes/claim-evidence.js";
import { CompareBody, CompareResponse } from "./routes/compare.js";
import { EntityParams, EntityQuery, EntityResponse } from "./routes/entity.js";
import { ExploreQuery, ExploreResponse } from "./routes/explore.js";
import { MarketParams, MarketQuery, MarketResponse } from "./routes/market.js";
import { SearchQuery, SearchResponse } from "./routes/search.js";
import { StackParams, StackQuery, StackResponse } from "./routes/stack.js";
import { TaskParams, TaskQuery, TaskResponse } from "./routes/task.js";
import { UpdatesQuery, UpdatesResponse } from "./routes/updates.js";

/** One table of every public route: method, path, and the schemas of its inputs and output. */
export const ROUTES = {
  entity: { method: "GET", path: "/entities/:slug", params: EntityParams, query: EntityQuery, response: EntityResponse },
  search: { method: "GET", path: "/search", query: SearchQuery, response: SearchResponse },
  explore: { method: "GET", path: "/explore", query: ExploreQuery, response: ExploreResponse },
  stack: { method: "GET", path: "/robots/:slug/stack", params: StackParams, query: StackQuery, response: StackResponse },
  task: { method: "GET", path: "/tasks/:slug", params: TaskParams, query: TaskQuery, response: TaskResponse },
  market: { method: "GET", path: "/markets/:slug", params: MarketParams, query: MarketQuery, response: MarketResponse },
  compare: { method: "POST", path: "/compare", body: CompareBody, response: CompareResponse },
  atlas: { method: "GET", path: "/atlas", query: AtlasQuery, response: AtlasResponse },
  updates: { method: "GET", path: "/updates", query: UpdatesQuery, response: UpdatesResponse },
  claimEvidence: { method: "GET", path: "/claims/:id/evidence", params: ClaimEvidenceParams, response: ClaimEvidenceResponse },
} as const;

export type RouteName = keyof typeof ROUTES;
export type RouteResponse<R extends RouteName> = z.infer<(typeof ROUTES)[R]["response"]>;
