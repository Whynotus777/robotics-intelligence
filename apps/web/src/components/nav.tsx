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
    <nav className="flex shrink-0 flex-col gap-0.5 border-b border-line-soft bg-rail px-3 py-3 lg:h-dvh lg:w-[200px] lg:border-r lg:border-b-0 lg:py-4">
      <Link href="/" className="flex items-center gap-2 px-2 pb-2 lg:pb-[18px]">
        <span className="inline-block size-[18px] rounded-chip bg-ink" />
        <span className="text-[13px] font-semibold">Robotics Intelligence</span>
      </Link>
      <div className="-mx-3 flex gap-0.5 overflow-x-auto px-3 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
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
