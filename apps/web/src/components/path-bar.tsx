"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Hop = { href: string; label: string };

const KEY = "ri.path";
const VISIBLE = 5;

function read(): Hop[] {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Hop[]) : [];
  } catch {
    return [];
  }
}

/**
 * The path bar records the route taken and the lens in use. Navigation is
 * unbounded; orientation is preserved by keeping every step clickable and
 * collapsing the middle once the trail runs past six hops.
 */
export function PathBar({ label, lens, checked }: { label: string; lens?: string; checked?: string | null }) {
  const pathname = usePathname();
  const [trail, setTrail] = useState<Hop[]>([]);

  useEffect(() => {
    const previous = read();
    const seen = previous.findIndex((hop) => hop.href === pathname);
    const next = seen === -1 ? [...previous, { href: pathname, label }] : previous.slice(0, seen + 1);
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(next.slice(-24)));
    } catch {
      /* a private window simply gets no trail */
    }
    setTrail(next);
  }, [pathname, label]);

  const shown = trail.length > VISIBLE + 1 ? trail.slice(-VISIBLE) : trail;
  const collapsed = trail.length - shown.length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] text-ink-3">
        {collapsed > 0 ? (
          <>
            <Link href={trail[0]?.href ?? "/"} className="hover:text-ink">
              {trail[0]?.label}
            </Link>
            <span className="text-ink-5">/</span>
            <span className="num text-ink-4" title={`${collapsed} earlier steps`}>
              …
            </span>
            <span className="text-ink-5">/</span>
          </>
        ) : null}
        {shown.map((hop, index) => {
          const last = index === shown.length - 1;
          return (
            <span key={hop.href} className="flex min-w-0 items-center gap-1.5">
              {last ? (
                <span className="truncate text-ink">{hop.label}</span>
              ) : (
                <Link href={hop.href} className="truncate hover:text-ink">
                  {hop.label}
                </Link>
              )}
              {last ? null : <span className="text-ink-5">/</span>}
            </span>
          );
        })}
        {trail.length === 0 ? <span className="text-ink">{label}</span> : null}
        {lens ? (
          <span className="num ml-1.5 rounded-[3px] border border-line-strong px-1.5 py-0.5 text-[10px] text-ink-4">
            {lens}
          </span>
        ) : null}
      </div>
      {checked ? (
        <div className="num flex items-center gap-1.5 text-[11px] text-ink-4">
          <i className="box-border inline-block size-1.5 rounded-full border border-ink-4" />
          checked {checked}
        </div>
      ) : null}
    </div>
  );
}
