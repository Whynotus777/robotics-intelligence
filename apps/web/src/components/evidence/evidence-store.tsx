"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type EvidenceStore = { claimId: string | null; open: (claimId: string) => void; close: () => void };

const Context = createContext<EvidenceStore | null>(null);

const PARAM = "evidence";

/**
 * One drawer for the whole product. Opening it is a facet, not navigation: the
 * parent view stays mounted and visible, and the URL is updated in place so a
 * drawer can still be linked to.
 */
export function EvidenceStoreProvider({ children }: { children: ReactNode }) {
  const [claimId, setClaimId] = useState<string | null>(null);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get(PARAM);
    if (initial) setClaimId(initial);
  }, []);

  const sync = useCallback((next: string | null) => {
    const url = new URL(window.location.href);
    if (next) url.searchParams.set(PARAM, next);
    else url.searchParams.delete(PARAM);
    window.history.replaceState(window.history.state, "", url);
  }, []);

  const open = useCallback(
    (next: string) => {
      setClaimId(next);
      sync(next);
    },
    [sync],
  );

  const close = useCallback(() => {
    setClaimId(null);
    sync(null);
  }, [sync]);

  const value = useMemo(() => ({ claimId, open, close }), [claimId, open, close]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useEvidence(): EvidenceStore {
  const store = useContext(Context);
  if (!store) throw new Error("useEvidence outside EvidenceStoreProvider");
  return store;
}
