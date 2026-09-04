"use client";

"use client";

import { useMemo, useState } from "react";
import { CANONICAL_LAYERS, type CanonicalLayer } from "@ri/domain";
import type { EntityChip, ExploreLens, ExploreResponse, StackResponse } from "@ri/api-contracts";
import { VizStyles } from "./styles.js";
import type { OpenEntity } from "./types.js";

const LENSES: readonly ExploreLens[] = ["embodiment", "market", "technology", "geography", "maturity"];

type StackItem = StackResponse["layers"][number]["items"][number];
type CellItem = { robot: EntityChip; item: StackItem };

export type ExploreStackMatrixProps = {
  /** The partition tree provides the columns and robot memberships for this challenger. */
  data: ExploreResponse;
  responses?: Partial<Record<ExploreLens, ExploreResponse>>;
  /** Stack route responses are passed in by the parent; this component never fetches them. */
  stacks?: readonly StackResponse[];
  initialLens?: ExploreLens;
  onOpenEntity?: OpenEntity;
};

function title(lens: ExploreLens) { return lens === "market" ? "Market" : lens[0]!.toUpperCase() + lens.slice(1); }
function color(entity: EntityChip) {
  const tones: Record<string, string> = { HUMANOID: "#9d8fd6", COBOT: "#d19a66", INDUSTRIAL_ARM: "#d19a66", AMR: "#6cb28a", DRONE: "#6aa6d6", QUADRUPED: "#d07a7a" };
  return tones[entity.primary_embodiment ?? ""] ?? "#c2b26a";
}

export function ExploreStackMatrix({ data, responses, stacks = [], initialLens, onOpenEntity }: ExploreStackMatrixProps) {
  const [lens, setLens] = useState<ExploreLens>(initialLens ?? data.lens);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const selected = responses?.[lens] ?? data;
  const stackByRobot = useMemo(() => new Map(stacks.map((stack) => [stack.robot.id, stack])), [stacks]);
  const robotByRegion = useMemo(() => new Map(selected.regions.map((region) => {
    const seen = new Map<string, EntityChip>();
    region.districts.flatMap((district) => district.entities).forEach(({ chip }) => { if (chip.entity_type === "ROBOT") seen.set(chip.id, chip); });
    return [region.id, [...seen.values()]] as const;
  })), [selected]);
  const cellItems = (regionId: string, layer: CanonicalLayer): CellItem[] => (robotByRegion.get(regionId) ?? []).flatMap((robot) => {
    const found = stackByRobot.get(robot.id)?.layers.find((candidate) => candidate.canonical === layer);
    return found?.items.map((item) => ({ robot, item })) ?? [];
  });

  return <section className="ri-viz" aria-label="Explore stack-first matrix">
    <VizStyles />
    <div className="ri-viz__toolbar">
      <div className="ri-viz__switcher" aria-label="Matrix lens">
        {LENSES.map((option) => <button key={option} type="button" aria-pressed={lens === option} onClick={() => { setLens(option); setExpanded(null); }}>{title(option)}</button>)}
      </div>
      <span className="ri-viz__hint">columns = lens · rows = canonical stack layers · double-click a column to expand</span>
    </div>
    <div className="ri-matrix">
      <div className="ri-matrix__grid" style={{ "--ri-columns": selected.regions.length } as React.CSSProperties}>
        <div className="ri-matrix__corner" />
        {selected.regions.map((region) => <button key={region.id} className="ri-matrix__head" type="button" onDoubleClick={() => setExpanded((current) => current === region.id ? null : region.id)} title="Double-click to expand this column">
          {region.label}<small>{region.count} entities</small>
        </button>)}
        <div className="ri-matrix__row-label">Robots</div>
        {selected.regions.map((region) => <div key={`robots:${region.id}`} className="ri-matrix__cell" data-expanded={expanded === region.id}>
          {(robotByRegion.get(region.id) ?? []).slice(0, expanded === region.id ? undefined : 5).map((robot) => <button key={robot.id} className="ri-matrix__chip" type="button" onClick={() => onOpenEntity?.(robot)}>{robot.name}</button>)}
        </div>)}
        {CANONICAL_LAYERS.map((layer) => <MatrixRow key={layer} layer={layer} regions={selected.regions} expanded={expanded} items={cellItems} hovered={hovered} setHovered={setHovered} onOpenEntity={onOpenEntity} />)}
      </div>
      <div className="ri-matrix__legend">Marks represent products and technology classes attached to a robot’s canonical stack layer. Empty cells are intentionally quiet.</div>
    </div>
  </section>;
}

function MatrixRow({ layer, regions, expanded, items, hovered, setHovered, onOpenEntity }: {
  layer: CanonicalLayer;
  regions: ExploreResponse["regions"];
  expanded: string | null;
  items: (regionId: string, layer: CanonicalLayer) => CellItem[];
  hovered: string | null;
  setHovered: (value: string | null) => void;
  onOpenEntity?: OpenEntity;
}) {
  return <>
    <div className="ri-matrix__row-label">{layer.replaceAll("_", " ")}</div>
    {regions.map((region) => {
      const values = items(region.id, layer);
      const visible = expanded === region.id ? values : values.slice(0, 4);
      return <div key={`${layer}:${region.id}`} className="ri-matrix__cell" data-expanded={expanded === region.id}>
        {visible.map(({ robot, item }) => {
          const key = `${region.id}:${layer}:${robot.id}:${item.entity.id}`;
          const isHovered = key === hovered;
          return expanded === region.id
            ? <button key={key} className="ri-matrix__chip" type="button" onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)} onClick={() => onOpenEntity?.(item.entity)} title={`${item.entity.name} · ${robot.name}`}>{item.entity.name}{isHovered ? ` · ${robot.name}` : ""}</button>
            : <button key={key} className="ri-matrix__dot" type="button" style={{ "--size": `${Math.min(22, 10 + values.length * 2)}px`, "--tone": color(robot) } as React.CSSProperties} onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)} onClick={() => onOpenEntity?.(item.entity)} aria-label={`${item.entity.name} used by ${robot.name}`} title={`${item.entity.name} · ${robot.name}`}>{isHovered ? "•" : ""}</button>;
        })}
      </div>;
    })}
  </>;
}
