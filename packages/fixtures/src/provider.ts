import type {
  AtlasResponse, ClaimEvidenceResponse, CompareResponse, DiscoveryFilters, EntityResponse, ExploreResponse, MarketResponse,
  RobotsResponse, SearchResponse, StackMatrixResponse, StackResponse, TaskResponse, UpdatesResponse,
} from "@ri/api-contracts";

export type SearchOptions = DiscoveryFilters & { limit?: number };
export type RobotFilters = Omit<DiscoveryFilters, "entity_type">;

export interface DataProvider {
  entity(slug: string, asOf?: string): Promise<EntityResponse>;
  search(q?: string, filters?: SearchOptions): Promise<SearchResponse>;
  explore(lens: string, measure?: string, asOf?: string, filters?: DiscoveryFilters): Promise<ExploreResponse>;
  stackMatrix(lens?: string): Promise<StackMatrixResponse>;
  robots(filters?: RobotFilters, asOf?: string): Promise<RobotsResponse>;
  stack(slug: string, asOf?: string): Promise<StackResponse>;
  task(slug: string, asOf?: string): Promise<TaskResponse>;
  market(slug: string, asOf?: string): Promise<MarketResponse>;
  compare(slugs: string[], asOf?: string): Promise<CompareResponse>;
  atlas(layer?: string, bbox?: string, asOf?: string): Promise<AtlasResponse>;
  updates(query?: Record<string, string>): Promise<UpdatesResponse>;
  claimEvidence(id: string): Promise<ClaimEvidenceResponse>;
}

function matches(entity: EntityResponse, filters: DiscoveryFilters) {
  return (!filters.entity_type || entity.entity.entity_type === filters.entity_type)
    && (!filters.embodiment || entity.entity.primary_embodiment === filters.embodiment)
    && (!filters.commercial_stage || entity.cached.commercial_stage === filters.commercial_stage)
    && (!filters.maturity || entity.cached.maturity === filters.maturity)
    && (!filters.country_code || entity.entity.country_code === filters.country_code.toUpperCase());
}

export class FixtureProvider implements DataProvider {
  constructor(private readonly fixtures: Record<string, unknown>) {}
  private get<T>(key: string): Promise<T> { const value = this.fixtures[key]; if (value === undefined) return Promise.reject(new Error(`fixture missing: ${key}`)); return Promise.resolve(value as T); }
  private entities() { return Object.entries(this.fixtures).filter(([key]) => key.startsWith("entity/")).map(([, value]) => value as EntityResponse); }
  entity(slug: string) { return this.get<EntityResponse>(`entity/${slug}`); }
  search(q?: string, filters: SearchOptions = {}) {
    if (q && Object.keys(filters).length === 0) return this.get<SearchResponse>(`search/${q}`);
    const needle = q?.toLowerCase();
    const results = this.entities().filter((entity) => matches(entity, filters)).flatMap((entity) => {
      const field = !needle ? "name" : entity.entity.name.toLowerCase().includes(needle) ? "name" : entity.entity.aliases.some((alias) => alias.toLowerCase().includes(needle)) ? "alias" : entity.entity.short_description?.toLowerCase().includes(needle) ? "description" : null;
      return field ? [{ chip: { id: entity.entity.id, slug: entity.entity.slug, entity_type: entity.entity.entity_type, name: entity.entity.name, primary_embodiment: entity.entity.primary_embodiment }, entity_type: entity.entity.entity_type, match_field: field, rank: needle ? (field === "name" ? 3 : field === "alias" ? 2 : 1) : 0 }] : [];
    }).sort((a, b) => b.rank - a.rank || a.chip.name.localeCompare(b.chip.name) || a.chip.slug.localeCompare(b.chip.slug)).slice(0, filters.limit ?? 20);
    return Promise.resolve({ query: q ?? "", results } as SearchResponse);
  }
  async explore(lens: string, measure = "none", _asOf?: string, filters: DiscoveryFilters = {}) {
    const response = await this.get<ExploreResponse>(`explore/${lens}/${measure}`);
    if (Object.keys(filters).length === 0) return response;
    const allowed = new Set(this.entities().filter((entity) => matches(entity, filters)).map((entity) => entity.entity.id));
    return { ...response, regions: response.regions.flatMap((region) => {
      const districts = region.districts.flatMap((district) => { const entities = district.entities.filter(({ chip }) => allowed.has(chip.id)); return entities.length ? [{ ...district, count: new Set(entities.map(({ chip }) => chip.id)).size, entities }] : []; });
      const ids = new Set(districts.flatMap((district) => district.entities.map(({ chip }) => chip.id)));
      return districts.length ? [{ ...region, count: ids.size, districts }] : [];
    }) };
  }
  stackMatrix(lens = "embodiment") { return this.get<StackMatrixResponse>(`stack-matrix/${lens}`); }
  robots(filters: RobotFilters = {}) {
    const robots = this.entities().filter((entity) => entity.entity.entity_type === "ROBOT" && matches(entity, filters)).map(({ entity }) => ({ id: entity.id, slug: entity.slug, entity_type: entity.entity_type, name: entity.name, primary_embodiment: entity.primary_embodiment })).sort((a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
    return Promise.resolve({ robots, as_of: null } as RobotsResponse);
  }
  stack(slug: string) { return this.get<StackResponse>(`stack/${slug}`); }
  task(slug: string) { return this.get<TaskResponse>(`task/${slug}`); }
  market(slug: string) { return this.get<MarketResponse>(`market/${slug}`); }
  compare(slugs: string[]) { return this.get<CompareResponse>(`compare/${slugs.join("-")}`); }
  atlas(layer = "hq") { return this.get<AtlasResponse>(`atlas/${layer}`); }
  updates() { return this.get<UpdatesResponse>("updates"); }
  claimEvidence(id: string) { return this.get<ClaimEvidenceResponse>(`claim/${id}`); }
}

export class HttpProvider implements DataProvider {
  constructor(private readonly baseUrl = "", private readonly request: typeof fetch = fetch) {}
  private async send<T>(path: string, init?: RequestInit): Promise<T> { const response = await this.request(`${this.baseUrl}${path}`, init); if (!response.ok) throw new Error(`${response.status} ${path}`); return response.json() as Promise<T>; }
  private query(path: string, values: Record<string, string | number | undefined>) { const query = new URLSearchParams(Object.entries(values).filter((entry): entry is [string, string | number] => entry[1] !== undefined).map(([key, value]) => [key, String(value)])); return `${path}${query.size ? `?${query}` : ""}`; }
  entity(slug: string, asOf?: string) { return this.send<EntityResponse>(this.query(`/entities/${encodeURIComponent(slug)}`, { as_of: asOf })); }
  search(q?: string, filters: SearchOptions = {}) { return this.send<SearchResponse>(this.query("/search", { q, ...filters })); }
  explore(lens: string, measure = "none", asOf?: string, filters: DiscoveryFilters = {}) { return this.send<ExploreResponse>(this.query("/explore", { lens, measure, as_of: asOf, ...filters })); }
  stackMatrix(lens = "embodiment") { return this.send<StackMatrixResponse>(this.query("/explore/stack-matrix", { lens })); }
  robots(filters: RobotFilters = {}, asOf?: string) { return this.send<RobotsResponse>(this.query("/robots", { ...filters, as_of: asOf })); }
  stack(slug: string, asOf?: string) { return this.send<StackResponse>(this.query(`/robots/${encodeURIComponent(slug)}/stack`, { as_of: asOf })); }
  task(slug: string, asOf?: string) { return this.send<TaskResponse>(this.query(`/tasks/${encodeURIComponent(slug)}`, { as_of: asOf })); }
  market(slug: string, asOf?: string) { return this.send<MarketResponse>(this.query(`/markets/${encodeURIComponent(slug)}`, { as_of: asOf })); }
  compare(slugs: string[], asOf?: string) { return this.send<CompareResponse>("/compare", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slugs, as_of: asOf }) }); }
  atlas(layer = "hq", bbox?: string, asOf?: string) { return this.send<AtlasResponse>(this.query("/atlas", { layer, bbox, as_of: asOf })); }
  updates(query: Record<string, string> = {}) { return this.send<UpdatesResponse>(this.query("/updates", query)); }
  claimEvidence(id: string) { return this.send<ClaimEvidenceResponse>(`/claims/${encodeURIComponent(id)}/evidence`); }
}

export function createDataProvider(fixtures: Record<string, unknown>, options: { mode?: string; baseUrl?: string; request?: typeof fetch } = {}): DataProvider {
  const mode = options.mode ?? (typeof process === "undefined" ? undefined : process.env.DATA_PROVIDER) ?? "fixture";
  if (mode === "fixture") return new FixtureProvider(fixtures);
  if (mode === "http") return new HttpProvider(options.baseUrl ?? (typeof process === "undefined" ? "" : process.env.API_BASE_URL) ?? "http://localhost:4000", options.request);
  throw new Error(`unsupported DATA_PROVIDER: ${mode}`);
}
