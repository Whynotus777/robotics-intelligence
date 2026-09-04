"use client";

"use client";

import { hierarchy, treemap, treemapSquarify, type HierarchyRectangularNode } from "d3-hierarchy";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import type { EntityChip, ExploreLens, ExploreMeasure, ExploreResponse } from "@ri/api-contracts";
import { VizStyles } from "./styles.js";
import { evidenceLabel, type ExploreEntityMeta, type OpenEntity } from "./types.js";

const WIDTH = 1_000;
const HEIGHT = 560;
const LENSES: readonly ExploreLens[] = ["embodiment", "market", "technology", "geography", "maturity"];
const MEASURES: readonly ExploreMeasure[] = ["deployments", "robots", "none"];

type ExploreEntity = ExploreResponse["regions"][number]["districts"][number]["entities"][number];
type LayoutDatum =
  | { kind: "root"; key: string; children: LayoutDatum[] }
  | { kind: "region"; key: string; label: string; count: number; children: LayoutDatum[] }
  | { kind: "district"; key: string; label: string; count: number; children: LayoutDatum[] }
  | { kind: "entity"; key: string; entity: ExploreEntity; value: number };
type Rect = { x: number; y: number; width: number; height: number; datum: LayoutDatum };
type Hover = { entity: ExploreEntity; x: number; y: number };
type RegionDatum = Extract<LayoutDatum, { kind: "region" }>;
type DistrictDatum = Extract<LayoutDatum, { kind: "district" }>;
type EntityDatum = Extract<LayoutDatum, { kind: "entity" }>;

export type ExploreTerritoriesProps = {
  /** The response currently selected by a composition layer. No fetching occurs here. */
  data: ExploreResponse;
  /** Optional fixture/API responses allow the component to own its five-lens switcher. */
  responses?: Partial<Record<ExploreLens, Partial<Record<ExploreMeasure, ExploreResponse>>>>;
  initialLens?: ExploreLens;
  initialMeasure?: ExploreMeasure;
  entityMeta?: Record<string, ExploreEntityMeta>;
  onOpenEntity?: OpenEntity;
};

function toLayout(data: ExploreResponse): LayoutDatum {
  return {
    kind: "root",
    key: "root",
    children: data.regions.map((region) => ({
      kind: "region",
      key: `region:${region.id}`,
      label: region.label,
      count: region.count,
      children: region.districts.map((district) => ({
        kind: "district",
        key: `district:${region.id}:${district.id}`,
        label: district.label,
        count: district.count,
        children: district.entities.map((entity) => ({
          kind: "entity",
          key: `entity:${entity.chip.id}:${region.id}:${district.id}`,
          entity,
          value: Math.max(1, entity.measure_value ?? 1),
        })),
      })),
    })),
  };
}

function layout(data: ExploreResponse) {
  const root = hierarchy<LayoutDatum>(toLayout(data), (datum) => ("children" in datum ? datum.children : undefined))
    .sum((datum) => (datum.kind === "entity" ? datum.value : 0))
    .sort((left, right) => (right.value ?? 0) - (left.value ?? 0) || left.data.key.localeCompare(right.data.key));
  const arranged = treemap<LayoutDatum>()
    .size([WIDTH, HEIGHT])
    .paddingOuter(5)
    .paddingInner(3)
    .round(true)
    .tile(treemapSquarify)(root);
  const byKey = new Map<string, Rect>();
  arranged.descendants().forEach((node: HierarchyRectangularNode<LayoutDatum>) => {
    if (node.data.kind === "root") return;
    byKey.set(node.data.key, { x: node.x0, y: node.y0, width: node.x1 - node.x0, height: node.y1 - node.y0, datum: node.data });
  });
  return byKey;
}

function tone(id: string) {
  const match: Record<string, string> = {
    HUMANOID: "#9d8fd6", COBOT: "#d19a66", INDUSTRIAL_ARM: "#d19a66", AMR: "#6cb28a", DRONE: "#6aa6d6",
    QUADRUPED: "#d07a7a", AUTONOMOUS_VEHICLE: "#7f8fd6", TECHNOLOGY: "#c2b26a", MARKET: "#c2b26a",
  };
  return match[id] ?? "#7f8fd6";
}

function labelForLens(lens: ExploreLens) { return lens === "market" ? "Market" : lens[0]!.toUpperCase() + lens.slice(1); }

export function ExploreTerritories({ data, responses, initialLens, initialMeasure, entityMeta = {}, onOpenEntity }: ExploreTerritoriesProps) {
  const [lens, setLens] = useState<ExploreLens>(initialLens ?? data.lens);
  const [measure, setMeasure] = useState<ExploreMeasure>(initialMeasure ?? data.measure);
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const selected = responses?.[lens]?.[measure] ?? responses?.[lens]?.["none"] ?? data;
  const rects = useMemo(() => layout(selected), [selected]);
  const regionRects = Array.from(rects.values()).filter((rect): rect is Rect & { datum: RegionDatum } => rect.datum.kind === "region");
  const districtRects = Array.from(rects.values()).filter((rect): rect is Rect & { datum: DistrictDatum } => rect.datum.kind === "district");
  const entityRects = Array.from(rects.values()).filter((rect): rect is Rect & { datum: EntityDatum } => rect.datum.kind === "entity");
  const target = focus ? rects.get(focus) : undefined;
  const scale = target ? Math.min(WIDTH / target.width, HEIGHT / target.height) * 0.93 : 1;
  const transform = target ? `translate(${-target.x * scale + (WIDTH - target.width * scale) / 2}px, ${-target.y * scale + (HEIGHT - target.height * scale) / 2}px) scale(${scale})` : "translate(0px, 0px) scale(1)";

  useEffect(() => { setFocus(null); setHover(null); }, [selected]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setFocus(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const setSelectedLens = (next: ExploreLens) => { setLens(next); setMeasure(responses?.[next]?.[measure] ? measure : "none"); };
  const entityHover = (event: MouseEvent<SVGCircleElement>, entity: ExploreEntity) => {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!bounds) return;
    setHover({ entity, x: event.clientX - bounds.left + 12, y: event.clientY - bounds.top + 12 });
  };

  return <section className="ri-viz" aria-label="Explore nested territories">
    <VizStyles />
    <div className="ri-viz__toolbar">
      <div className="ri-viz__switcher" aria-label="Explore lens">
        {LENSES.map((option) => <button key={option} type="button" aria-pressed={lens === option} onClick={() => setSelectedLens(option)}>{labelForLens(option)}</button>)}
      </div>
      <div className="ri-viz__switcher" aria-label="Size measure">
        {MEASURES.map((option) => <button key={option} type="button" aria-pressed={measure === option} onClick={() => setMeasure(option)}>{option === "none" ? "Uniform" : `By ${option}`}</button>)}
      </div>
      {focus ? <button className="ri-viz__hint" type="button" onClick={() => setFocus(null)}>Esc · zoom out</button> : <span className="ri-viz__hint">Region level · {labelForLens(lens)}</span>}
    </div>
    <div className="ri-territories" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${labelForLens(lens)} territories`}>
        <g style={{ transform, transformOrigin: "0 0" }}>
          {regionRects.map((rect) => {
            const region = rect.datum;
            return <g key={region.key} className="ri-territories__region" onClick={() => setFocus(region.key)} onDoubleClick={() => setFocus(region.key)} role="button" tabIndex={0} aria-label={`Zoom to ${region.label}`} onKeyDown={(event) => { if (event.key === "Enter") setFocus(region.key); }}>
              <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={5} fill={`${tone(region.key.replace("region:", ""))}22`} stroke="#1e222b" />
              <text className="ri-territories__label" x={rect.x + 12} y={rect.y + 17}>{region.label.toUpperCase()}</text>
              <text className="ri-territories__count" x={rect.x + 12} y={rect.y + 34}>{region.count} {region.count === 1 ? "entity" : "entities"}</text>
            </g>;
          })}
          {districtRects.map((rect) => {
            const district = rect.datum;
            return <g key={district.key} className="ri-territories__district" onClick={(event) => { event.stopPropagation(); setFocus(district.key); }} role="button" tabIndex={0} aria-label={`Zoom to ${district.label}`} onKeyDown={(event) => { if (event.key === "Enter") setFocus(district.key); }}>
              <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={3} fill="#0e0f13" stroke="#232730" />
              {rect.width > 110 && rect.height > 42 ? <text className="ri-territories__count" x={rect.x + 8} y={rect.y + 15}>{district.label}</text> : null}
            </g>;
          })}
          {entityRects.map((rect) => {
            const leaf = rect.datum;
            const radius = Math.max(4, Math.min(15, Math.min(rect.width, rect.height) / 3));
            return <circle key={leaf.key} className="ri-territories__entity" cx={rect.x + rect.width / 2} cy={rect.y + rect.height / 2} r={radius} fill={tone(leaf.entity.chip.primary_embodiment ?? leaf.entity.chip.entity_type)} stroke={leaf.entity.is_primary_membership ? "#e6e8ec" : "#646b78"} strokeWidth={1} onMouseEnter={(event) => entityHover(event, leaf.entity)} onClick={(event) => { event.stopPropagation(); onOpenEntity?.(leaf.entity.chip); }} />;
          })}
        </g>
      </svg>
      {hover ? <HoverCard hover={hover} meta={entityMeta[hover.entity.chip.slug]} /> : null}
    </div>
  </section>;
}

function HoverCard({ hover, meta }: { hover: Hover; meta?: ExploreEntityMeta }) {
  return <aside className="ri-territories__tooltip" style={{ left: Math.min(hover.x, 740), top: Math.min(hover.y, 430) }}>
    <strong>{hover.entity.chip.name}</strong>
    <span>{hover.entity.chip.entity_type.replaceAll("_", " ")}</span>
    {meta?.description ? <p>{meta.description}</p> : null}
    {meta?.stage_or_maturity ? <p>{meta.stage_or_maturity}</p> : null}
    {meta?.evidence_summary ? <span>{evidenceLabel(meta.evidence_summary)}</span> : null}
  </aside>;
}
