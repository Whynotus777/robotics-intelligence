import type {
  AtlasResponse, ClaimEvidenceResponse, CompareResponse, EntityResponse, ExploreResponse, MarketResponse, SearchResponse,
  StackResponse, TaskResponse, UpdatesResponse,
} from "@ri/api-contracts";

/** The only data boundary used by screens.  Fixture and HTTP mode have identical shapes. */
export interface DataProvider {
  entity(slug: string, asOf?: string): Promise<EntityResponse>;
  search(q: string): Promise<SearchResponse>;
  explore(lens: string, measure?: string, asOf?: string): Promise<ExploreResponse>;
  stack(slug: string, asOf?: string): Promise<StackResponse>;
  task(slug: string, asOf?: string): Promise<TaskResponse>;
  market(slug: string, asOf?: string): Promise<MarketResponse>;
  compare(slugs: string[], asOf?: string): Promise<CompareResponse>;
  atlas(layer?: string, bbox?: string, asOf?: string): Promise<AtlasResponse>;
  updates(query?: Record<string, string>): Promise<UpdatesResponse>;
  claimEvidence(id: string): Promise<ClaimEvidenceResponse>;
}

export class FixtureProvider implements DataProvider {
  constructor(private readonly fixtures: Record<string, unknown>) {}
  private get<T>(key: string): Promise<T> { const value = this.fixtures[key]; if (value === undefined) return Promise.reject(new Error(`fixture missing: ${key}`)); return Promise.resolve(value as T); }
  entity(slug: string) { return this.get<EntityResponse>(`entity/${slug}`); }
  search(q: string) { return this.get<SearchResponse>(`search/${q}`); }
  explore(lens: string, measure = "none") { return this.get<ExploreResponse>(`explore/${lens}/${measure}`); }
  stack(slug: string) { return this.get<StackResponse>(`stack/${slug}`); }
  task(slug: string) { return this.get<TaskResponse>(`task/${slug}`); }
  market(slug: string) { return this.get<MarketResponse>(`market/${slug}`); }
  compare(slugs: string[]) { return this.get<CompareResponse>(`compare/${slugs.join("-")}`); }
  atlas(layer = "hq") { return this.get<AtlasResponse>(`atlas/${layer}`); }
  updates() { return this.get<UpdatesResponse>("updates"); }
  claimEvidence(id: string) { return this.get<ClaimEvidenceResponse>(`claim/${id}`); }
}

/** Minimal production implementation; callers can inject a fetch compatible with Next/server runtimes. */
export class HttpProvider implements DataProvider {
  constructor(private readonly baseUrl = "", private readonly request: typeof fetch = fetch) {}
  private async get<T>(path: string): Promise<T> { const r = await this.request(`${this.baseUrl}${path}`); if (!r.ok) throw new Error(`${r.status} ${path}`); return r.json() as Promise<T>; }
  entity(slug:string,asOf?:string){return this.get<EntityResponse>(`/entities/${slug}${asOf?`?as_of=${asOf}`:""}`)} search(q:string){return this.get<SearchResponse>(`/search?q=${encodeURIComponent(q)}`)} explore(l:string,m="none",a?:string){return this.get<ExploreResponse>(`/explore?lens=${l}&measure=${m}${a?`&as_of=${a}`:""}`)} stack(slug:string,a?:string){return this.get<StackResponse>(`/robots/${slug}/stack${a?`?as_of=${a}`:""}`)} task(slug:string,a?:string){return this.get<TaskResponse>(`/tasks/${slug}${a?`?as_of=${a}`:""}`)} market(slug:string,a?:string){return this.get<MarketResponse>(`/markets/${slug}${a?`?as_of=${a}`:""}`)}
  async compare(slugs:string[],asOf?:string){const r=await this.request(`${this.baseUrl}/compare`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({slugs,as_of:asOf})});if(!r.ok)throw new Error(`${r.status} /compare`);return r.json() as Promise<CompareResponse>}
  atlas(layer="hq",bbox?:string,a?:string){return this.get<AtlasResponse>(`/atlas?layer=${layer}${bbox?`&bbox=${bbox}`:""}${a?`&as_of=${a}`:""}`)} updates(q:Record<string,string>={}){return this.get<UpdatesResponse>(`/updates?${new URLSearchParams(q)}`)} claimEvidence(id:string){return this.get<ClaimEvidenceResponse>(`/claims/${id}/evidence`)}
}
