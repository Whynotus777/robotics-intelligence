import Link from "next/link";

export type FilterOption = { label: string; value: string | null };

/**
 * Filters are links, not state: the URL carries the current view so a filtered
 * screen can be shared and the back button behaves.
 */
export function FilterGroup({
  name,
  current,
  options,
  basePath,
  params,
}: {
  name: string;
  current: string | null;
  options: FilterOption[];
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="eyebrow mr-1">{name}</span>
      {options.map((option) => {
        const next = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) if (value) next.set(key, value);
        if (option.value) next.set(name.toLowerCase().replace(/\s/g, "_"), option.value);
        else next.delete(name.toLowerCase().replace(/\s/g, "_"));
        const active = current === option.value;
        return (
          <Link
            key={option.label}
            href={`${basePath}${next.size ? `?${next}` : ""}`}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
              active
                ? "border-line-strong bg-raised text-ink"
                : "border-line text-ink-3 hover:border-line-strong hover:text-ink"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
