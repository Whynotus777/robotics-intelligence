import Link from "next/link";
import type { AtlasResponse } from "@ri/api-contracts";
import { ATLAS_LAYERS } from "@ri/api-contracts";
import { AtlasMap, type AtlasMarkView } from "@/components/atlas/atlas-map";
import { PathBar } from "@/components/path-bar";
import { data, orNotFound } from "@/lib/data";
import { MAP_HEIGHT, MAP_WIDTH, project, worldPath } from "@/lib/world";

export const metadata = { title: "Atlas" };

type Search = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** What each layer answers, so the switcher says more than a one-word label. */
const LAYER_QUESTION: Record<string, string> = {
  BUILT: "Where robots are designed and built — OEM headquarters and their factories.",
  SUPPLIED: "Where the parts come from — component suppliers and chipmakers.",
  MANUFACTURED: "Who builds them for someone else — contract manufacturers.",
  DEPLOYED: "Where robots are actually working, by the place of the deployment.",
  TRAINED: "Where the models come from — model developers and research labs.",
  FUNDED: "Where the money is — investors backing robotics.",
  PLATFORMS: "The conglomerates whose robotics reach spans several roles at once.",
};

function readLayer(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && (ATLAS_LAYERS as readonly string[]).includes(raw) ? raw : "BUILT";
}

/**
 * Atlas: where robotics actually happens. One layer at a time over one drawn
 * world map, because a place is on BUILT for a different reason than it is on
 * DEPLOYED and merging the two says neither. Marks are sized by how many
 * distinct entities sit on them and coloured by embodiment where the mix says
 * one dominates; the list mirrors whatever the viewport holds, and the country
 * and corridor rollups are the same marks read from further out.
 */
export default async function AtlasPage({ searchParams }: Search) {
  const params = await searchParams;
  const active = readLayer(params.layer);
  const provider = await data();
  const payload = await orNotFound(provider.atlas(active));

  const layers = payload?.layers ?? [];
  const current = layers.find((layer) => layer.id === active);
  const label = current?.label ?? active;
  const marks: AtlasMarkView[] = (payload?.marks ?? []).map((mark) => ({
    place: mark.place,
    ...project(mark.lng, mark.lat),
    countryCode: mark.country_code,
    clusterLabel: mark.cluster_label,
    weight: mark.weight,
    layers: [{ layer: active, label, entities: mark.entities }],
    entities: mark.entities,
    embodimentMix: mark.embodiment_mix,
  }));

  return (
    <div className="flex max-w-[1400px] flex-col gap-5">
      <PathBar label="Atlas" lens={label} />

      <div className="flex flex-col gap-2">
        <span className="eyebrow">Where does it happen</span>
        <h1 className="text-[24px]/[1.1] font-semibold tracking-[-0.02em]">Atlas</h1>
        <p className="max-w-[640px] text-[13px]/[1.6] text-ink-3">
          {LAYER_QUESTION[active] ?? "Where robotics activity actually happens, not only where headquarters are."}
        </p>
      </div>

      {/* Layers are links, so a view of the world can be shared as it is. A layer
          with nothing on it says so before you click rather than after. */}
      <div className="flex flex-wrap items-center gap-1.5 border-y border-line-soft py-3">
        <span className="eyebrow mr-1">Layer</span>
        {layers.map((layer) => {
          const on = layer.id === active;
          const empty = layer.count === 0;
          return (
            <Link
              key={layer.id}
              href={`/atlas?layer=${layer.id}`}
              prefetch={false}
              aria-current={on ? "true" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                on
                  ? "border-line-strong bg-raised text-ink"
                  : empty
                    ? "border-line text-ink-5 hover:border-line-strong hover:text-ink-3"
                    : "border-line text-ink-3 hover:border-line-strong hover:text-ink"
              }`}
            >
              <i className={`inline-block size-1.5 rounded-full ${on ? "bg-accent" : empty ? "bg-line" : "bg-line-strong"}`} />
              {layer.label}
              <span className="num text-[10px] text-ink-4">{layer.count}</span>
            </Link>
          );
        })}
      </div>

      {marks.length > 0 ? (
        <>
          <AtlasMap marks={marks} worldPath={worldPath()} width={MAP_WIDTH} height={MAP_HEIGHT} />
          <Rollups payload={payload!} />
        </>
      ) : (
        <p className="max-w-[560px] text-[13px]/[1.6] text-ink-3">
          Nothing is placed on {label} yet. Sites are recorded claim by claim, so an empty layer is a gap in the record,
          not an empty world — try{" "}
          <Link href="/atlas?layer=BUILT" prefetch={false} className="text-accent hover:underline">
            Built
          </Link>
          .
        </p>
      )}
    </div>
  );
}

/** The same marks read from further out: by country, and by named corridor. */
function Rollups({ payload }: { payload: AtlasResponse }) {
  const groups = [
    { title: "By country", rows: payload.countries },
    { title: "By corridor", rows: payload.corridors },
  ].filter((group) => group.rows.length > 0);
  if (groups.length === 0) return null;

  return (
    <div className="grid gap-6 border-t border-line-soft pt-4 sm:grid-cols-2">
      {groups.map((group) => (
        <div key={group.title} className="flex min-w-0 flex-col gap-2">
          <span className="eyebrow">{group.title}</span>
          <div className="flex flex-col divide-y divide-line-soft">
            {group.rows.slice(0, 12).map((row) => (
              <div key={row.id} className="flex items-baseline gap-3 py-1.5 text-[12px]">
                <span className="min-w-0 truncate text-ink-2">{row.label}</span>
                <span className="num ml-auto shrink-0 text-ink">{row.weight}</span>
                <span className="num shrink-0 text-[11px] text-ink-4">
                  {row.places} place{row.places === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
