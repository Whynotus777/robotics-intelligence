import Link from "next/link";
import type { MarketResponse } from "@ri/api-contracts";
import { data, orNotFound } from "@/lib/data";

/**
 * The sector rail. Sectors are the markets with no parent; their domains nest
 * underneath. A sector with nothing beneath it still lists — it is a real part of
 * the map, not a gap.
 */
export async function SectorRail({ activeSlugs }: { activeSlugs: string[] }) {
  const provider = await data();
  const { results } = await provider.search(undefined, { entity_type: "MARKET", limit: 50 });
  const markets = (
    await Promise.all(results.map((hit) => orNotFound(provider.market(hit.chip.slug))))
  ).filter((market): market is MarketResponse => market !== null);

  const sectors = markets
    .filter((market) => market.path.length === 0)
    .sort((a, b) => a.market.name.localeCompare(b.market.name));

  return (
    <nav className="flex flex-col gap-0.5 lg:w-[180px] lg:shrink-0">
      <div className="eyebrow px-2.5 pb-2">Sectors</div>
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {sectors.map((sector) => {
          const active = activeSlugs.includes(sector.market.slug);
          return (
            <div key={sector.market.id} className="flex shrink-0 flex-col lg:shrink">
              <Link
                href={`/m/${sector.market.slug}`}
                className={`truncate rounded-[4px] px-2.5 py-1.5 text-[12px] transition-colors ${
                  active ? "text-ink lg:border-l-2 lg:border-accent lg:pl-2" : "text-ink-3 hover:text-ink"
                }`}
              >
                {sector.market.name}
              </Link>
              {active && sector.children.length > 0 ? (
                <div className="hidden flex-col lg:flex">
                  {sector.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/m/${child.slug}`}
                      className={`truncate rounded-[4px] py-1 pr-2.5 pl-[22px] text-[12px] transition-colors ${
                        activeSlugs.includes(child.slug) ? "text-ink" : "text-ink-4 hover:text-ink-2"
                      }`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
