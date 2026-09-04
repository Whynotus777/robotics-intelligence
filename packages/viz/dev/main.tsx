import { createRoot } from "react-dom/client";
import "./style.css";
import type { ExploreLens, ExploreResponse, StackMatrixResponse, StackResponse } from "@ri/api-contracts";
import { ExploreStackMatrix, ExploreTerritories, RobotMRI } from "../src/index.js";
import embodiment from "../../fixtures/generated/explore__embodiment__none.json";
import geography from "../../fixtures/generated/explore__geography__none.json";
import market from "../../fixtures/generated/explore__market__none.json";
import maturity from "../../fixtures/generated/explore__maturity__none.json";
import technology from "../../fixtures/generated/explore__technology__none.json";
import g1 from "../../fixtures/generated/stack__unitree-g1.json";
import locus from "../../fixtures/generated/stack__locus-origin.json";
import ur20 from "../../fixtures/generated/stack__universal-robots-ur20.json";
import x10 from "../../fixtures/generated/stack__skydio-x10.json";
import matrixEmbodiment from "../../fixtures/generated/stack-matrix__embodiment.json";
import matrixGeography from "../../fixtures/generated/stack-matrix__geography.json";
import matrixMarket from "../../fixtures/generated/stack-matrix__market.json";
import matrixMaturity from "../../fixtures/generated/stack-matrix__maturity.json";
import matrixTechnology from "../../fixtures/generated/stack-matrix__technology.json";

const explores = {
  embodiment: { none: embodiment as ExploreResponse },
  market: { none: market as ExploreResponse },
  technology: { none: technology as ExploreResponse },
  geography: { none: geography as ExploreResponse },
  maturity: { none: maturity as ExploreResponse },
} satisfies Partial<Record<ExploreLens, Partial<Record<"none", ExploreResponse>>>>;
const matrices = {
  embodiment: matrixEmbodiment as StackMatrixResponse,
  market: matrixMarket as StackMatrixResponse,
  technology: matrixTechnology as StackMatrixResponse,
  geography: matrixGeography as StackMatrixResponse,
  maturity: matrixMaturity as StackMatrixResponse,
} satisfies Partial<Record<ExploreLens, StackMatrixResponse>>;
const stacks = [g1, x10, locus, ur20] as StackResponse[];
const opened = (entity: { name: string }) => window.alert(`Open entity: ${entity.name}`);

function App() {
  return <main>
    <header><span>Robotics Intelligence</span><small>Agent 2 · fixture review</small></header>
    <section><div className="eyebrow">1A · NESTED TERRITORIES</div><h1>Explore the robotics landscape</h1><ExploreTerritories data={embodiment as ExploreResponse} responses={explores} onOpenEntity={opened} /></section>
    <section><div className="eyebrow">1B · STACK-FIRST CHALLENGER</div><h2>Embodiment × stack layer</h2><ExploreStackMatrix data={matrices.embodiment} responses={matrices} onOpenEntity={opened} /></section>
    <section><div className="eyebrow">5.3 · ROBOT MRI</div><h2>Unitree G1 stack</h2><RobotMRI stack={g1 as StackResponse} comparisonStacks={stacks} initialLayer="COMPUTE" onOpenEntity={opened} /></section>
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);
