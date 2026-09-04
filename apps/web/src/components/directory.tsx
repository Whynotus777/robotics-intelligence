import Link from "next/link";
import type { EntityType } from "@ri/domain";
import { PathBar } from "@/components/path-bar";
import { TypeGlyph } from "@/components/glyph";
import { data } from "@/lib/data";
import { hrefFor } from "@/lib/vocabulary";

/** A plain directory of one entity type. The palette does the searching. */
export async function Directory({
  title,
  question,
  entityType,
  intro,
}: {
  title: string;
  question: string;
  entityType: EntityType;
  intro?: string;
}) {
  const provider = await data();
  const { results } = await provider.search(undefined, { entity_type: entityType, limit: 50 });

  return (
    <div className="flex max-w-[1180px] flex-col gap-5">
      <PathBar label={title} />
      <div className="flex flex-col gap-2">
        <span className="eyebrow">{question}</span>
        <h1 className="text-[24px]/[1.1] font-semibold tracking-[-0.02em]">{title}</h1>
        {intro ? <p className="max-w-[620px] text-[13px] text-ink-3">{intro}</p> : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((hit) => (
          <Link
            key={hit.chip.id}
            href={hrefFor(hit.chip)}
            className="flex items-center gap-2 rounded-panel border border-line-soft bg-panel-deep px-3 py-2.5 transition-colors hover:border-line-strong"
          >
            <TypeGlyph chip={hit.chip} />
            <span className="min-w-0 flex-1 truncate text-[13px]">{hit.chip.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
