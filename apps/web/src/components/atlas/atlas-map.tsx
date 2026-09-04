"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { EntityChip } from "@ri/api-contracts";
import type { Embodiment } from "@ri/domain";
import { EntityChipLink } from "@/components/entity-chip";
import { TypeGlyph } from "@/components/glyph";
import { EMBODIMENT_LABEL, EMBODIMENT_ORDER, embodimentColor, hrefFor } from "@/lib/vocabulary";

export type AtlasMarkView = {
  place: EntityChip;
  x: number;
  y: number;
  countryCode: string | null;
  clusterLabel: string | null;
  /** Which of the active layers put this place on the map, with its entities. */
  layers: { layer: string; label: string; entities: EntityChip[] }[];
  entities: EntityChip[];
  embodimentMix: Partial<Record<Embodiment, number>>;
};

type Box = { x: number; y: number; w: number; h: number };

const RATIO = 2; // the equirectangular map is 1000 × 500

export function AtlasMap({
  marks,
  worldPath,
  width,
  height,
}: {
  marks: AtlasMarkView[];
  worldPath: string;
  width: number;
  height: number;
}) {
  const [box, setBox] = useState<Box>({ x: 0, y: 0, w: width, h: height });
  const [selected, setSelected] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; box: Box; moved: boolean } | null>(null);
  const moved = useRef(false);

  const clamp = useCallback(
    (next: Box): Box => {
      const w = Math.min(width, Math.max(width / 12, next.w));
      const h = w / RATIO;
      return {
        w,
        h,
        x: Math.min(width - w, Math.max(0, next.x)),
        y: Math.min(height - h, Math.max(0, next.y)),
      };
    },
    [width, height],
  );

  const zoom = useCallback(
    (factor: number, at?: { x: number; y: number }) =>
      setBox((current) => {
        const w = current.w * factor;
        const focus = at ?? { x: current.x + current.w / 2, y: current.y + current.h / 2 };
        const scale = w / current.w;
        return clamp({
          w,
          h: w / RATIO,
          x: focus.x - (focus.x - current.x) * scale,
          y: focus.y - (focus.y - current.y) * scale,
        });
      }),
    [clamp],
  );

  // Wheel has to be a non-passive listener to zoom without scrolling the page.
  useEffect(() => {
    const node = svgRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      setBox((current) => {
        const factor = Math.exp(event.deltaY * 0.0015);
        const w = Math.min(width, Math.max(width / 12, current.w * factor));
        const scale = w / current.w;
        const focusX = current.x + ((event.clientX - rect.left) / rect.width) * current.w;
        const focusY = current.y + ((event.clientY - rect.top) / rect.height) * current.h;
        return clamp({
          w,
          h: w / RATIO,
          x: focusX - (focusX - current.x) * scale,
          y: focusY - (focusY - current.y) * scale,
        });
      });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [clamp, width]);

  // Dragging listens on the window rather than capturing the pointer, so a click
  // on a mark still reaches the mark; a drag that moved is not a click.
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const start = drag.current;
      const node = svgRef.current;
      if (!start || !node) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) start.moved = true;
      const rect = node.getBoundingClientRect();
      setBox(
        clamp({
          ...start.box,
          x: start.box.x - (dx / rect.width) * start.box.w,
          y: start.box.y - (dy / rect.height) * start.box.h,
        }),
      );
    };
    const onUp = () => {
      // The click event follows pointerup; the flag has to outlive this tick.
      const start = drag.current;
      drag.current = null;
      if (start?.moved) {
        moved.current = true;
        window.setTimeout(() => (moved.current = false), 0);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [clamp]);

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    drag.current = { x: event.clientX, y: event.clientY, box, moved: false };
  };

  // The list mirrors the map: only what is inside the current viewport.
  const visible = useMemo(
    () =>
      marks.filter(
        (mark) => mark.x >= box.x && mark.x <= box.x + box.w && mark.y >= box.y && mark.y <= box.y + box.h,
      ),
    [marks, box],
  );
  const active = marks.find((mark) => mark.place.id === selected) ?? null;
  const scale = box.w / width;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="relative overflow-hidden rounded-panel border border-line-soft bg-panel-deep">
          <svg
            ref={svgRef}
            viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
            className="block w-full cursor-grab touch-none active:cursor-grabbing"
            style={{ aspectRatio: `${RATIO}` }}
            onPointerDown={onPointerDown}
            role="img"
            aria-label="World map of robotics activity"
          >
            <path
              d={worldPath}
              fill="var(--color-panel)"
              stroke="var(--color-line-strong)"
              strokeWidth={0.5 * scale}
            />
            {marks.map((mark) => {
              const colour = dominantColour(mark.embodimentMix);
              const radius = (3 + Math.sqrt(mark.entities.length) * 1.6) * scale;
              const chosen = mark.place.id === selected;
              return (
                <g key={mark.place.id} onClick={() => !moved.current && setSelected(mark.place.id)}>
                  <circle
                    cx={mark.x}
                    cy={mark.y}
                    r={radius}
                    fill={colour}
                    fillOpacity={chosen ? 0.95 : 0.7}
                    stroke={chosen ? "var(--color-ink)" : colour}
                    strokeWidth={(chosen ? 1.2 : 0.6) * scale}
                    className="cursor-pointer"
                  />
                  {box.w < width / 2.5 ? (
                    <text
                      x={mark.x + radius + 2 * scale}
                      y={mark.y + 2 * scale}
                      fill="var(--color-ink-3)"
                      style={{ font: `${7 * scale}px var(--font-mono)` }}
                    >
                      {mark.clusterLabel ?? mark.place.name}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>

          <div className="absolute top-2 right-2 flex gap-1">
            {[
              { label: "+", onClick: () => zoom(1 / 1.5) },
              { label: "−", onClick: () => zoom(1.5) },
              { label: "Reset", onClick: () => setBox({ x: 0, y: 0, w: width, h: height }) },
            ].map((button) => (
              <button
                key={button.label}
                type="button"
                onClick={button.onClick}
                className="num cursor-pointer rounded-[3px] border border-line-strong bg-ground/80 px-2 py-1 text-[11px] text-ink-3 hover:text-ink"
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="num text-[11px] text-ink-4">
            {visible.length} of {marks.length} place{marks.length === 1 ? "" : "s"} in view · drag to pan, scroll to zoom
          </span>
          <EmbodimentKey marks={marks} />
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[340px]">
        {active ? <PlacePanel mark={active} onClose={() => setSelected(null)} /> : null}
        <div className="flex flex-col gap-2">
          <span className="eyebrow">In view</span>
          {visible.length === 0 ? (
            <p className="text-[12px] text-ink-4">Nothing on this layer inside the current viewport.</p>
          ) : (
            <div className="flex max-h-[520px] flex-col divide-y divide-line-soft overflow-y-auto">
              {visible.flatMap((mark) =>
                mark.entities.map((entity) => (
                  <div
                    key={`${mark.place.id}-${entity.id}`}
                    className="flex items-center gap-2 py-1.5 text-[12px]"
                  >
                    <Link href={hrefFor(entity)} className="flex min-w-0 items-center gap-1.5 hover:text-accent">
                      <TypeGlyph chip={entity} />
                      <span className="truncate">{entity.name}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelected(mark.place.id)}
                      className="num ml-auto shrink-0 cursor-pointer text-[11px] text-ink-4 hover:text-ink"
                    >
                      {mark.clusterLabel ?? mark.place.name}
                    </button>
                  </div>
                )),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** The Place profile: what this dot actually is, and everything on it. */
function PlacePanel({ mark, onClose }: { mark: AtlasMarkView; onClose: () => void }) {
  const mix = EMBODIMENT_ORDER.flatMap((embodiment) => {
    const count = mark.embodimentMix[embodiment];
    return count ? [{ embodiment, count }] : [];
  });

  return (
    <aside className="flex flex-col gap-3 rounded-panel border border-line bg-panel-deep p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Place</span>
          <Link href={hrefFor(mark.place)} className="text-[15px]/[1.3] font-semibold hover:text-accent">
            {mark.place.name}
          </Link>
          <span className="num text-[11px] text-ink-4">
            {[mark.clusterLabel, mark.countryCode].filter(Boolean).join(" · ")}
          </span>
        </div>
        <button type="button" onClick={onClose} className="cursor-pointer text-[12px] text-ink-5 hover:text-ink">
          ×
        </button>
      </div>

      {mix.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-3">
          {mix.map((row) => (
            <span key={row.embodiment} className="inline-flex items-center gap-1.5 text-[11px] text-ink-3">
              <i
                className="inline-block size-2 rounded-[2px]"
                style={{ background: embodimentColor(row.embodiment) }}
              />
              {EMBODIMENT_LABEL[row.embodiment]}
              <span className="num text-ink-4">{row.count}</span>
            </span>
          ))}
        </div>
      ) : null}

      {mark.layers.map((layer) => (
        <div key={layer.layer} className="flex flex-col gap-2 border-t border-line-soft pt-3">
          <span className="eyebrow">{layer.label}</span>
          <div className="flex flex-wrap gap-1.5">
            {layer.entities.map((entity) => (
              <EntityChipLink key={entity.id} chip={entity} />
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

function EmbodimentKey({ marks }: { marks: AtlasMarkView[] }) {
  const present = EMBODIMENT_ORDER.filter((embodiment) =>
    marks.some((mark) => (mark.embodimentMix[embodiment] ?? 0) > 0),
  );
  if (present.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {present.map((embodiment) => (
        <span key={embodiment} className="inline-flex items-center gap-1.5 text-[11px] text-ink-4">
          <i className="inline-block size-2 rounded-full" style={{ background: embodimentColor(embodiment) }} />
          {EMBODIMENT_LABEL[embodiment]}
        </span>
      ))}
    </div>
  );
}

/** Marks carry the embodiment colour where the mix says one dominates. */
function dominantColour(mix: Partial<Record<Embodiment, number>>): string {
  let best: Embodiment | null = null;
  for (const embodiment of EMBODIMENT_ORDER)
    if ((mix[embodiment] ?? 0) > (best ? (mix[best] ?? 0) : 0)) best = embodiment;
  return best ? embodimentColor(best) : "var(--color-ink-3)";
}
