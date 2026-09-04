"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCommandPalette } from "@/components/command-palette";

const NAV = [
  { label: "Explore", href: "/", match: (path: string) => path === "/" },
  { label: "Markets", href: "/markets", match: (path: string) => path.startsWith("/markets") || path.startsWith("/m/") || path.startsWith("/t/") },
  { label: "Robots", href: "/robots", match: (path: string) => path.startsWith("/robots") || path.startsWith("/r/") },
  { label: "Companies", href: "/companies", match: (path: string) => path.startsWith("/companies") },
  { label: "Technology", href: "/technology", match: (path: string) => path.startsWith("/technology") },
  { label: "Atlas", href: "/atlas", match: (path: string) => path.startsWith("/atlas") },
  { label: "Updates", href: "/updates", match: (path: string) => path.startsWith("/updates") },
];

/** Persistent 200px left rail at 1024+, a horizontal scroller below it. */
export function NavRail() {
  const pathname = usePathname();
  const { open } = useCommandPalette();

  return (
    <nav className="flex w-full min-w-0 shrink-0 flex-col gap-0.5 overflow-x-clip border-b border-line-soft bg-rail px-3 py-3 lg:h-dvh lg:w-[200px] lg:overflow-x-visible lg:border-r lg:border-b-0 lg:py-4">
      <div className="flex items-center justify-between gap-2 pb-2 lg:pb-[18px]">
        <Link href="/" className="flex min-w-0 items-center gap-2 px-2">
          <span className="inline-block size-[18px] shrink-0 rounded-chip bg-ink" />
          <span className="truncate text-[13px] font-semibold">Robotics Intelligence</span>
        </Link>
        {/* Below 1024px there is no keyboard to press ⌘K with, so search is a tap target. */}
        <button
          type="button"
          onClick={open}
          aria-label="Search"
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-line-soft text-ink-3 active:bg-raised lg:hidden"
        >
          <span className="box-border inline-block size-4 rounded-full border-[1.5px] border-current" />
        </button>
      </div>
      <div className="flex min-w-0 gap-0.5 overflow-x-auto lg:flex-col lg:overflow-visible">
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-[5px] px-2.5 py-[7px] text-[13px] font-medium transition-colors ${
                active ? "bg-[#1a1d25] text-ink" : "text-ink-3 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        onClick={open}
        className="num mt-auto hidden cursor-pointer items-center justify-between px-2.5 py-2 text-[11px] text-ink-4 hover:text-ink lg:flex"
      >
        <span>Search</span>
        <span>⌘K</span>
      </button>
    </nav>
  );
}
