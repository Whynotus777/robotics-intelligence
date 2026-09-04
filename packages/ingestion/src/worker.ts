import type { ResolutionCandidate } from "@ri/db";

/** 0b boundary only. Agent 3 implements fetching, extraction, and proposal creation. */
export interface FetchedSource {
  sourceId: string;
  fetchedAt: string;
  content: Uint8Array;
  contentHash: string;
  snapshotPointer: string;
}

export interface ExtractedCandidate {
  predicate: string;
  value: string | number;
  excerpt: string;
}

export interface IngestionWorker {
  fetch(source: { id: string; url: string }): Promise<FetchedSource>;
  extract(fetch: FetchedSource): Promise<ExtractedCandidate[]>;
  resolve(value: string): Promise<ResolutionCandidate[]>;
  propose(candidates: ExtractedCandidate[], sourceId: string): Promise<void>;
}

/** Hash gate used by workers: unchanged content stops before extract/resolve/propose. */
export function shouldProcessFetchedContent(previousHash: string | null, incomingHash: string): boolean {
  return previousHash !== incomingHash;
}
