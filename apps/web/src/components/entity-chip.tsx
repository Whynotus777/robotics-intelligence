import Link from "next/link";
import type { EntityChip as Chip } from "@ri/api-contracts";
import { TypeGlyph } from "@/components/glyph";
import { hrefFor } from "@/lib/vocabulary";

/**
 * The clickable identity of an entity. Used everywhere an entity is referenced,
 * so entity-to-entity hops go on indefinitely.
 */
export function EntityChipLink({
  chip,
  showType = false,
  className = "",
}: {
  chip: Chip;
  showType?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={hrefFor(chip)}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-chip border border-line bg-raised px-2 py-[5px] text-[12px] leading-none font-medium text-ink transition-colors hover:border-line-strong hover:bg-[#1f232b] ${className}`}
    >
      <TypeGlyph chip={chip} />
      <span className="truncate">{chip.name}</span>
      {showType ? <span className="num shrink-0 text-[10px] text-ink-4">{chip.entity_type}</span> : null}
    </Link>
  );
}

/** The quieter pill form used in lateral-link strips and requirement lists. */
export function PillLink({ chip }: { chip: Chip }) {
  return (
    <Link
      href={hrefFor(chip)}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-3 transition-colors hover:border-line-strong hover:text-ink"
    >
      <TypeGlyph chip={chip} size={7} />
      <span className="truncate">{chip.name}</span>
    </Link>
  );
}
