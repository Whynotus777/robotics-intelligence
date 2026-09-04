"use client";

import Link from "next/link";
import type { CompareResponse } from "@ri/api-contracts";
import { TypeGlyph } from "@/components/glyph";
import { useEvidence } from "@/components/evidence/evidence-store";
import { chipText } from "@/components/evidence/evidence-chip";
import { formatValue, hrefFor, sentenceCase } from "@/lib/vocabulary";

type Group = CompareResponse["groups"][number];
type Cell = Group["rows"][number]["cells"][number];

/**
 * Two to four entities as columns, rows grouped by stack layer for robots and by
 * attribute family otherwise. A row exists only where at least two columns have
 * a value, so the table never fills with blanks; a column that lacks a value on
 * a kept row shows nothing at all. Every value is a claim, so every cell opens
 * the Evidence Drawer.
 */
export function CompareTable({
  columns,
  groups,
  groupLabels,
}: {
  columns: CompareResponse["columns"];
  groups: Group[];
  /** Presentation label per group key, resolved on the server. */
  groupLabels: Record<string, string>;
}) {
  const width = `minmax(140px,180px) repeat(${columns.length}, minmax(150px,1fr))`;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div
          className="sticky top-0 z-10 grid items-end gap-px border-b border-line bg-ground pb-2"
          style={{ gridTemplateColumns: width }}
        >
          <span className="eyebrow pb-1">Attribute</span>
          {columns.map((column) => (
            <Link
              key={column.id}
              href={hrefFor(column)}
              className="flex min-w-0 items-center gap-1.5 px-2.5 pb-1 text-[13px] font-semibold hover:text-accent"
            >
              <TypeGlyph chip={column} />
              <span className="truncate">{column.name}</span>
            </Link>
          ))}
        </div>

        {groups.map((group) => (
          <div key={group.group} className="flex flex-col">
            <div className="grid gap-px border-b border-line-soft pt-4 pb-1.5" style={{ gridTemplateColumns: width }}>
              <span className="eyebrow">{groupLabels[group.group] ?? group.label}</span>
            </div>
            {group.rows.map((row) => (
              <div
                key={`${group.group}-${row.predicate}`}
                className="grid items-baseline gap-px border-b border-line-soft/70 py-2"
                style={{ gridTemplateColumns: width }}
              >
                <span className="pr-3 text-[12px] text-ink-4">{sentenceCase(row.label)}</span>
                {row.cells.map((cell, index) => (
                  <CompareCell key={columns[index]?.id ?? index} cell={cell} />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareCell({ cell }: { cell: Cell }) {
  const { open } = useEvidence();
  if (!cell || cell.values.length === 0)
    return <span className="px-2.5 text-[12px] text-ink-5">—</span>;

  return (
    <span className="flex min-w-0 flex-col gap-1 px-2.5">
      {cell.values.map((value) => {
        const numeric = value.value.kind === "number";
        const approximate = value.value.kind === "number" && value.value.is_approximate;
        return (
          <button
            key={value.claim_id}
            type="button"
            onClick={() => open(value.claim_id)}
            title={`${chipText(value.evidence_summary)}${approximate ? " · approximate" : ""}`}
            className="group flex min-w-0 cursor-pointer items-center gap-1.5 text-left"
          >
            <span
              className={`min-w-0 truncate text-[13px] text-ink group-hover:text-accent ${numeric ? "num" : ""}`}
            >
              {formatValue(value.value)}
            </span>
            {value.qualifier ? (
              <span className="truncate text-[11px] text-ink-4">{value.qualifier}</span>
            ) : null}
            <i
              className={`inline-block size-[5px] shrink-0 transition-colors group-hover:bg-accent ${
                value.evidence_summary.class === "ANALYST"
                  ? "rotate-45 bg-analyst"
                  : value.evidence_summary.class === "NOT_AVAILABLE"
                    ? "box-border border border-ink-5"
                    : "bg-ink-4"
              }`}
            />
          </button>
        );
      })}
    </span>
  );
}
