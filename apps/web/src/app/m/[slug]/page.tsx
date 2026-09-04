import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PathBar } from "@/components/path-bar";
import { SectorRail } from "@/components/market/sector-rail";
import { MaturityBoard } from "@/components/market/maturity-board";
import { EntityChipLink } from "@/components/entity-chip";
import { data, orNotFound } from "@/lib/data";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const market = await orNotFound((await data()).market(slug));
  return market ? { title: market.market.name, description: market.short_description ?? undefined } : {};
}

/** Market explorer: sector rail, domain header, task maturity board. */
export default async function MarketPage({ params }: Params) {
  const { slug } = await params;
  const market = await orNotFound((await data()).market(slug));
  if (!market) notFound();

  const assessed = market.board.filter((row) => row.maturity).length;

  return (
    <div className="flex max-w-[1240px] flex-col gap-5 lg:flex-row lg:gap-8">
      <SectorRail activeSlugs={[market.market.slug, ...market.path.map((step) => step.slug)]} />

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <PathBar
          label={market.market.name}
          checked={null}
        />
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-3.5">
            <h1 className="text-[24px]/[1.1] font-semibold tracking-[-0.02em]">{market.market.name}</h1>
            {market.short_description ? (
              <p className="max-w-[620px] text-[13px] text-ink-3">{market.short_description}</p>
            ) : null}
          </div>
          {assessed > 0 ? (
            <span className="num text-[11px] text-ink-4">{assessed} tasks assessed</span>
          ) : null}
        </div>

        {market.children.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">Domains</span>
            {market.children.map((child) => (
              <EntityChipLink key={child.id} chip={child} />
            ))}
          </div>
        ) : null}

        {market.board.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] text-ink-4">
              Task maturity · five steps · every value is an analyst assessment
            </span>
            <MaturityBoard board={market.board} />
          </div>
        ) : (
          <p className="py-8 text-[13px] text-ink-3">
            No tasks are assessed in {market.market.name} yet. That is a whitespace finding, not a missing page.
          </p>
        )}
      </div>
    </div>
  );
}
