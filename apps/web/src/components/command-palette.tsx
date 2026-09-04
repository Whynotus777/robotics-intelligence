"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { SearchResponse } from "@ri/api-contracts";
import { TypeGlyph } from "@/components/glyph";
import { hrefFor } from "@/lib/vocabulary";

type Palette = { isOpen: boolean; open: () => void; close: () => void };

const Context = createContext<Palette | null>(null);

export function useCommandPalette(): Palette {
  const palette = useContext(Context);
  if (!palette) throw new Error("useCommandPalette outside CommandPaletteProvider");
  return palette;
}

/** ⌘K everywhere: entities, markets, tasks and technologies, with the type inline. */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((wasOpen) => !wasOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);
  return (
    <Context.Provider value={value}>
      {children}
      {isOpen ? <Palette onClose={close} /> : null}
    </Context.Provider>
  );
}

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse["results"]>([]);
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    const handle = setTimeout(() => {
      const url = query.trim() ? `/api/search?q=${encodeURIComponent(query.trim())}` : "/api/search?entity_type=ROBOT";
      fetch(url)
        .then((response) => (response.ok ? response.json() : { results: [] }))
        .then((payload: SearchResponse) => {
          if (!live) return;
          setResults(payload.results ?? []);
          setCursor(0);
        })
        .catch(() => live && setResults([]));
    }, 120);
    return () => {
      live = false;
      clearTimeout(handle);
    };
  }, [query]);

  const go = useCallback(
    (index: number) => {
      const hit = results[index];
      if (!hit) return;
      onClose();
      router.push(hrefFor(hit.chip));
    },
    [results, router, onClose],
  );

  const onKey = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") return onClose();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((current) => Math.min(current + 1, results.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((current) => Math.max(current - 1, 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      go(cursor);
    }
  };

  return (
    <>
      <div role="presentation" onClick={onClose} className="fixed inset-0 z-40 bg-black/50" />
      <div className="fixed inset-x-3 top-[12vh] z-50 mx-auto max-w-[560px] overflow-hidden rounded-panel border border-line-strong bg-panel shadow-[0_24px_60px_rgba(0,0,0,.6)]">
        <div className="flex items-center gap-2.5 border-b border-line-soft px-3.5 py-3">
          <span className="box-border inline-block size-3.5 shrink-0 rounded-full border-[1.5px] border-ink-4" />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKey}
            placeholder="Search robots, companies, markets, tasks, technologies…"
            aria-label="Search"
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-4"
          />
          <span className="num shrink-0 rounded-[3px] border border-line-strong px-1.5 py-0.5 text-[10px] text-ink-4">
            Esc
          </span>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1">
          {results.length === 0 ? (
            <p className="px-3.5 py-6 text-[12px] text-ink-4">Nothing matches that yet.</p>
          ) : null}
          {results.map((hit, index) => (
            <button
              key={hit.chip.id}
              type="button"
              onMouseEnter={() => setCursor(index)}
              onClick={() => go(index)}
              className={`flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-[13px] ${
                index === cursor ? "bg-raised text-ink" : "text-ink-2"
              }`}
            >
              <TypeGlyph chip={hit.chip} />
              <span className="min-w-0 flex-1 truncate">{hit.chip.name}</span>
              <span className="num shrink-0 text-[10px] text-ink-4">{hit.entity_type}</span>
              {hit.match_field !== "name" ? (
                <span className="num shrink-0 text-[10px] text-ink-5">{hit.match_field}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/** The dominant search affordance on Explore. */
export function SearchLauncher() {
  const { open } = useCommandPalette();
  return (
    <button
      type="button"
      onClick={open}
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-panel border border-line-strong bg-panel px-3 py-2.5 text-left text-[13px] text-ink-4 transition-colors hover:border-ink-5 lg:w-[520px]"
    >
      <span className="box-border inline-block size-3.5 shrink-0 rounded-full border-[1.5px] border-ink-4" />
      <span className="min-w-0 flex-1 truncate">Search robots, companies, markets, tasks, technologies…</span>
      <span className="num shrink-0 rounded-[3px] border border-line-strong px-1.5 py-0.5 text-[10px]">⌘K</span>
    </button>
  );
}
