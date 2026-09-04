import Link from "next/link";
import type { AtlasResponse, EntityChip } from "@ri/api-contracts";
import { ATLAS_LAYERS } from "@ri/api-contracts";
import { AtlasMap, type AtlasMarkView } from "@/components/atlas/atlas-map";
import { PathBar } from "@/components/path-bar";
import { data, orNotFound } from "@/lib/data";
import { MAP_HEIGHT, MAP_WIDTH, project, worldPath } from "@/lib/world";

export const metadata = { title: "Atlas" };

type Search = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const LAYER_LABEL: Record<string, string> = {
  hq: "HQ",
  rnd: "R&D",
  manufacturing: "Manufacturing",
  deployments: "Deployments",
  research: "Research",
};

function readLayers(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const wanted = raw.flatMap((entry) => entry.split(",")).map((layer) => layer.trim());
  const valid = wanted.filter((layer) => (ATLAS_LAYERS as readonly string[]).includes(layer));
  return valid.length > 0 ? [...new Set(valid)] : ["hq"];
}

function href(layers: string[]): string {
  return layers.length > 0 ? `/atlas?layers=${layers.join(",")}` : "/atlas?layers=";
}

/**
 * Atlas: where robotics activity actually happens. Five layers over one drawn
 * world map, marks coloured by embodiment where the mix says one dominates, a
 * list that mirrors whatever the viewport holds, and a Place profile on click.
 */
export default async function AtlasPage({ searchParams }: Search) {
  const params = await searchParams;
  const active = readLayers(params.layers);
  const provider = await data();

  const payloads = await Promise.all(
    active.map(async (layer) => ({ layer, payload: await orNotFound(provider.atlas(layer)) })),
  );

  const merged = new Map<string, AtlasMarkView>();
  for (const { layer, payload } of payloads) {
    for (const mark of payload?.marks ?? []) {
      const existing =
        merged.get(mark.place.id) ??
        (merged.set(mark.place.id, {
          place: mark.place,
          ...project(mark.lng, mark.lat),
          countryCode: mark.country_code,
          clusterLabel: mark.cluster_label,
          layers: [],
          entities: [],
          embodimentMix: {},
        }),
        merged.get(mark.place.id)!);
      existing.layers.push({ layer, label: LAYER_LABEL[layer] ?? layer, entities: mark.entities });
      existing.entities = dedupe([...existing.entities, ...mark.entities]);
      for (const [embodiment, count] of Object.entries(mark.embodiment_mix))
        existing.embodimentMix[embodiment as keyof typeof existing.embodimentMix] =
          (existing.embodimentMix[embodiment as keyof typeof existing.embodimentMix] ?? 0) + (count ?? 0);
    }
  }

  const marks = [...merged.values()].sort((a, b) => b.entities.length - a.entities.length);
  const counts = new Map(payloads.map(({ layer, payload }) => [layer, countFor(payload)]));

  return (
    <div className="flex max-w-[1400px] flex-col gap-5">
      <PathBar label="Atlas" lens={active.map((layer) => LAYER_LABEL[layer] ?? layer).join(" + ")} />

      <div className="flex flex-col gap-2">
        <span className="eyebrow">Where does it happen</span>
        <h1 className="text-[24px]/[1.1] font-semibold tracking-[-0.02em]">Atlas</h1>
        <p className="max-w-[640px] text-[13px]/[1.6] text-ink-3">
          Where robotics activity actually happens, not only where headquarters are. Toggle the layers; the list beside
          the map holds whatever the viewport holds.
        </p>
      </div>

      {/* Layers are links, so a view of the world can be shared as it is. */}
      <div className="flex flex-wrap items-center gap-1.5 border-y border-line-soft py-3">
        <span className="eyebrow mr-1">Layers</span>
        {ATLAS_LAYERS.map((layer) => {
          const on = active.includes(layer);
          const next = on ? active.filter((entry) => entry !== layer) : [...active, layer];
          const count = counts.get(layer);
          return (
            <Link
              key={layer}
              href={href(next)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                on
                  ? "border-line-strong bg-raised text-ink"
                  : "border-line text-ink-3 hover:border-line-strong hover:text-ink"
              }`}
            >
              <i className={`inline-block size-1.5 rounded-full ${on ? "bg-accent" : "bg-line-strong"}`} />
              {LAYER_LABEL[layer]}
              {on && count ? <span className="num text-[10px] text-ink-4">{count}</span> : null}
            </Link>
          );
        })}
      </div>

      {marks.length > 0 ? (
        <AtlasMap marks={marks} worldPath={worldPath()} width={MAP_WIDTH} height={MAP_HEIGHT} />
      ) : (
        <p className="max-w-[560px] text-[13px]/[1.6] text-ink-3">
          Nothing is placed on {active.map((layer) => LAYER_LABEL[layer] ?? layer).join(" or ")} yet. Sites are recorded
          claim by claim, so an empty layer is a gap in the record — try{" "}
          <Link href={href(["hq"])} className="text-accent hover:underline">
            HQ
          </Link>
          .
        </p>
      )}
    </div>
  );
}

function countFor(payload: AtlasResponse | null): number {
  return payload ? new Set(payload.list.map((row) => row.entity.id)).size : 0;
}

function dedupe(chips: EntityChip[]): EntityChip[] {
  const seen = new Set<string>();
  return chips.filter((chip) => (seen.has(chip.id) ? false : (seen.add(chip.id), true)));
}
