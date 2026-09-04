"use client";

"use client";

import { useEffect, useMemo, useState } from "react";
import type { CanonicalLayer } from "@ri/domain";
import type { StackResponse } from "@ri/api-contracts";
import { VizStyles } from "./styles.js";
import { evidenceLabel, type OpenEntity } from "./types.js";

type LayerView = StackResponse["layers"][number];

export type RobotMRIProps = {
  /** The selected robot’s GET /robots/:slug/stack response. */
  stack: StackResponse;
  /** Other already-loaded stack route responses enable the cross-embodiment facet. */
  comparisonStacks?: readonly StackResponse[];
  initialLayer?: CanonicalLayer;
  onOpenEntity?: OpenEntity;
};

function canonicalName(layer: string) { return layer.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()); }

export function RobotMRI({ stack, comparisonStacks = [], initialLayer, onOpenEntity }: RobotMRIProps) {
  const firstLayer = initialLayer && stack.layers.some((layer) => layer.canonical === initialLayer) ? initialLayer : null;
  const [focused, setFocused] = useState<CanonicalLayer | null>(firstLayer);
  const peers = useMemo(() => comparisonStacks.filter((candidate) => candidate.robot.id !== stack.robot.id), [comparisonStacks, stack.robot.id]);
  const [crossSlug, setCrossSlug] = useState<string | null>(peers[0]?.robot.slug ?? null);
  const selectedLayer = focused ? stack.layers.find((layer) => layer.canonical === focused) : undefined;
  const crossStack = peers.find((candidate) => candidate.robot.slug === crossSlug) ?? peers[0];
  const crossLayer = selectedLayer && crossStack ? crossStack.layers.find((layer) => layer.canonical === selectedLayer.canonical) : undefined;

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setFocused(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => { setFocused(null); }, [stack.robot.id]);

  return <section className="ri-viz" aria-label={`${stack.robot.name} Robot MRI`}>
    <VizStyles />
    <div className="ri-viz__toolbar">
      <div><span className="ri-viz__hint">Robot MRI · {stack.embodiment.replaceAll("_", " ")}</span><div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{stack.robot.name}</div></div>
      {focused ? <button className="ri-viz__hint" type="button" onClick={() => setFocused(null)}>Esc · close layer</button> : <span className="ri-viz__hint">Select a layer to inspect it</span>}
    </div>
    <div className={`ri-mri${focused ? " ri-mri--focused" : ""}`}>
      <div className="ri-mri__layers">
        {stack.layers.map((layer) => <LayerButton key={layer.canonical} layer={layer} selected={focused === layer.canonical} onSelect={() => setFocused(layer.canonical)} onOpenEntity={onOpenEntity} />)}
      </div>
      <aside className="ri-mri__safety" aria-label="Safety cross-cutting layer">SAFETY</aside>
      {selectedLayer ? <LayerDetail layer={selectedLayer} stack={stack} crossStack={crossStack} crossLayer={crossLayer} peers={peers} crossSlug={crossSlug} setCrossSlug={setCrossSlug} onOpenEntity={onOpenEntity} /> : null}
    </div>
    {stack.safety.length ? <div className="ri-mri__section"><div className="ri-mri__section-title">SAFETY</div><div className="ri-mri__items">{stack.safety.map((item) => <button key={item.claim_id} className="ri-mri__chip" type="button" onClick={() => onOpenEntity?.(item.entity)}>{item.entity.name}</button>)}</div></div> : null}
  </section>;
}

function LayerButton({ layer, selected, onSelect, onOpenEntity }: { layer: LayerView; selected: boolean; onSelect: () => void; onOpenEntity?: OpenEntity }) {
  return <button type="button" className={`ri-mri__layer${layer.items.length ? "" : " ri-mri__layer--empty"}${selected ? " ri-mri__layer--selected" : ""}`} onClick={onSelect} aria-pressed={selected}>
    <span className="ri-mri__layer-label">{layer.label}</span>
    {layer.items.length ? <span className="ri-mri__items">{layer.items.map((item) => <span key={item.claim_id} className="ri-mri__chip" role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); onOpenEntity?.(item.entity); }} onKeyDown={(event) => { if (event.key === "Enter") onOpenEntity?.(item.entity); }}>{item.entity.name}</span>)}</span> : null}
  </button>;
}

function LayerDetail({ layer, stack, crossStack, crossLayer, peers, crossSlug, setCrossSlug, onOpenEntity }: {
  layer: LayerView;
  stack: StackResponse;
  crossStack?: StackResponse;
  crossLayer?: LayerView;
  peers: readonly StackResponse[];
  crossSlug: string | null;
  setCrossSlug: (slug: string) => void;
  onOpenEntity?: OpenEntity;
}) {
  const similar = peers.filter((candidate) => candidate.layers.some((candidateLayer) => candidateLayer.canonical === layer.canonical && candidateLayer.items.length > 0));
  return <article className="ri-mri__detail">
    <div className="ri-mri__eyebrow">LAYER · {canonicalName(layer.canonical)}</div>
    <h3>{layer.label}</h3>
    {layer.architecture_note ? <div className="ri-mri__section" style={{ marginTop: 0 }}><div className="ri-mri__section-title">KNOWN ARCHITECTURE · {evidenceLabel(layer.architecture_note.evidence_summary)}</div><p>{layer.architecture_note.text}</p></div> : null}
    {layer.items.length ? <div className="ri-mri__section"><div className="ri-mri__section-title">COMPONENTS & TECHNOLOGIES</div><div className="ri-mri__items">{layer.items.map((item) => <button key={item.claim_id} className="ri-mri__chip" type="button" onClick={() => onOpenEntity?.(item.entity)} title={evidenceLabel(item.evidence_summary)}>{item.entity.name}</button>)}</div></div> : null}
    {layer.items.length ? <div className="ri-mri__section"><div className="ri-mri__section-title">CLASS PROFILES</div><div className="ri-mri__items">{layer.items.filter((item) => item.kind === "technology").map((item) => <button key={item.claim_id} className="ri-mri__chip" type="button" onClick={() => onOpenEntity?.(item.entity)}>{item.entity.name} profile →</button>)}</div></div> : null}
    {peers.length ? <div className="ri-mri__section"><div className="ri-mri__section-title">SAME LAYER, OTHER EMBODIMENTS</div><div className="ri-mri__cross">{peers.map((candidate) => <button key={candidate.robot.id} type="button" aria-pressed={crossSlug === candidate.robot.slug} onClick={() => setCrossSlug(candidate.robot.slug)}>{candidate.embodiment.replaceAll("_", " ")}</button>)}</div>{crossStack && crossLayer ? <div style={{ marginTop: 10, color: "var(--ri-muted)", fontSize: 12 }}><strong style={{ color: "var(--ri-text)" }}>{crossStack.robot.name}</strong> · {crossLayer.label}{crossLayer.items.length ? ` · ${crossLayer.items.map((item) => item.entity.name).join(", ")}` : ""}</div> : null}</div> : null}
    {similar.length ? <div className="ri-mri__section"><div className="ri-mri__section-title">SIMILAR ROBOTS AT THIS LAYER</div><div className="ri-mri__items">{similar.map((candidate) => <button key={candidate.robot.id} className="ri-mri__chip" type="button" onClick={() => onOpenEntity?.(candidate.robot)}>{candidate.robot.name}</button>)}</div></div> : null}
    {layer.items.length || layer.architecture_note ? <div className="ri-mri__section"><div className="ri-mri__section-title">EVIDENCE</div><div className="ri-mri__items">{layer.architecture_note ? <span className="ri-mri__chip">Architecture · {evidenceLabel(layer.architecture_note.evidence_summary)}</span> : null}{layer.items.map((item) => <span key={item.claim_id} className="ri-mri__chip">{item.entity.name} · {evidenceLabel(item.evidence_summary)}</span>)}</div></div> : null}
  </article>;
}
