import Link from "next/link";
import type { EntityType } from "@ri/domain";
import { CompareTable } from "@/components/compare/compare-table";
import { EntityChipLink } from "@/components/entity-chip";
import { TypeGlyph } from "@/components/glyph";
import { PathBar } from "@/components/path-bar";
import { MAX_COLUMNS, MIN_COLUMNS, compareView, groupLabel, groupRank } from "@/lib/compare";
import { data } from "@/lib/data";
import { formatDate } from "@/lib/vocabulary";

export const metadata = { title: "Compare" };

type Search = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function readSlugs(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw.flatMap((entry) => entry.split(",")).map((slug) => slug.trim()).filter(Boolean);
}

function href(slugs: string[]): string {
  return slugs.length > 0 ? `/compare?slugs=${slugs.join(",")}` : "/compare";
}

/**
 * Compare: two to four entities of the same type, side by side. The usual door
 * is a profile's "compare with"; the picker below is the way in from the nav.
 */
export default async function ComparePage({ searchParams }: Search) {
  const params = await searchParams;
  const slugs = readSlugs(params.slugs).slice(0, MAX_COLUMNS);
  const view = await compareView(slugs);
  const columns = view?.response.columns ?? [];
  const selected = columns.map((column) => column.slug);

  const pickerType = (view?.entityType ?? "ROBOT") as EntityType;
  const provider = await data();
  const { results } = await provider.search(undefined, { entity_type: pickerType, limit: 60 });
  const candidates = results.filter((hit) => !selected.includes(hit.chip.slug));

  const groups = view
    ? [...view.response.groups]
        .map((group) => ({ ...group, rows: group.rows }))
        .sort((a, b) => groupRank(a.group) - groupRank(b.group))
        .filter((group) => group.rows.length > 0)
    : [];
  const groupLabels = Object.fromEntries(groups.map((group) => [group.group, groupLabel(group.group)]));
  const rowCount = groups.reduce((sum, group) => sum + group.rows.length, 0);

  return (
    <div className="flex max-w-[1240px] flex-col gap-6">
      <PathBar label="Compare" />

      <div className="flex flex-col gap-2">
        <span className="eyebrow">How does it compare</span>
        <h1 className="text-[24px]/[1.1] font-semibold tracking-[-0.02em]">Compare</h1>
        <p className="max-w-[640px] text-[13px]/[1.6] text-ink-3">
          Two to four {pickerType.replaceAll("_", " ").toLowerCase()}s side by side. A row appears only where at least
          two columns have a value, so what you see is what is actually known about both.
        </p>
      </div>

      {/* The selection is the URL: every column and candidate is a link. */}
      <div className="flex flex-col gap-3 border-y border-line-soft py-4">
        {columns.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow w-[74px] shrink-0">Comparing</span>
            {columns.map((column) => (
              <span key={column.id} className="inline-flex items-center gap-1">
                <EntityChipLink chip={column} />
                <Link
                  href={href(selected.filter((slug) => slug !== column.slug))}
                  aria-label={`Remove ${column.name}`}
                  className="text-[12px] text-ink-5 hover:text-conflict"
                >
                  ×
                </Link>
              </span>
            ))}
          </div>
        ) : null}

        {candidates.length > 0 && selected.length < MAX_COLUMNS ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="eyebrow w-[74px] shrink-0">Add</span>
            {candidates.slice(0, 24).map((hit) => (
              <Link
                key={hit.chip.id}
                href={href([...selected, hit.chip.slug])}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-3 transition-colors hover:border-line-strong hover:text-ink"
              >
                <TypeGlyph chip={hit.chip} size={7} />
                {hit.chip.name}
              </Link>
            ))}
          </div>
        ) : null}

        {view && view.dropped.length > 0 ? (
          <p className="text-[12px] text-ink-4">
            Left out:{" "}
            {view.dropped
              .map((row) =>
                row.reason === "missing"
                  ? `${row.slug} (no profile)`
                  : `${row.slug} (not the same kind of entity)`,
              )
              .join(" · ")}
          </p>
        ) : null}
      </div>

      {view && rowCount > 0 ? (
        <>
          <CompareTable columns={columns} groups={groups} groupLabels={groupLabels} />
          <p className="num text-[11px] text-ink-4">
            {rowCount} shared row{rowCount === 1 ? "" : "s"} across {columns.length} columns
            {view.response.as_of ? ` · as of ${formatDate(view.response.as_of)}` : ""}
          </p>
        </>
      ) : view ? (
        <p className="text-[13px] text-ink-3">
          {columns.map((column) => column.name).join(" and ")} share no attribute that both have a value for. That is a
          gap in what is recorded, not a verdict on the machines.
        </p>
      ) : (
        <p className="text-[13px] text-ink-3">
          Pick {MIN_COLUMNS} to {MAX_COLUMNS} of the same kind above, or start from a profile&apos;s{" "}
          <span className="text-ink-2">compare with</span> link.
        </p>
      )}
    </div>
  );
}
