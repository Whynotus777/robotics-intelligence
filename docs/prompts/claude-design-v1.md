# Claude Design prompt — Robotics Strategy Map (V1)

## Read this first (for Abdul, not for Claude Design)

Everything below the divider is the prompt. Paste it whole. The final calls I made, baked into the prompt rather than discussed in it:

- Explore uses **nested territories** (deterministic, treemap-like partitions with a zoom hierarchy) as the primary concept, plus **one challenger variant** in the same design language so we can choose from screens rather than prose. No force layout, no 3D for its own sake.
- Global IA is **Explore · Markets · Robots · Companies · Technology · Atlas · Updates**. Benchmarks live under Technology in V1; Deployments live inside Markets and profiles rather than as a top-level list.
- **Navigation is unbounded; orientation is preserved.** Detail opens in place, entity-to-entity hops go on indefinitely, and the path is always visible.
- **Two labeling systems reach the UI, not five.** One *evidence chip* (source class + confidence) and one *maturity scale* (five ordinal stages, always marked as analyst assessment). Robots additionally carry a *commercial stage*, which is a different question from task maturity. Depth tiers and the nine questions are internal disciplines and never appear as labels.
- **Evidence is one interaction away everywhere but visible by default only in a few places** (intelligence rail, drawer, Updates, next to analyst assessments). Analyst judgments carry a rationale and a "what would move it" list, not just a five-step chip.
- **Markets gets two states** — Energy → Wind → Blade repair, and Warehouse & Logistics → Pallet movement — so no screenshot can read as a drone/wind product with other categories bolted on.
- **Profile is one template** with Robot as the primary instance and Company as a designed second state. Updates takes the "supporting screen" slot.
- **One theme (dark), desktop-first, states only on Profile and the Drawer.** This keeps the system coherent and the deliverable finishable.
- **Fixture content is real** where it is spec-level public and low-risk, with its evidence class attached. Anything I was not confident dating is marked so it renders honestly in the drawer. Re-verify before it becomes seed data; the "last checked" field exists for exactly this reason.

---

# PROMPT

You are designing V1 of an interactive strategy map for robotics: a product where the technical architecture of robots and the commercial reality of the robotics market are shown in one connected system. It is not a directory, not a spec wiki, not a financial terminal, not a knowledge-graph hairball, and not a chat box with a database behind it. It should let someone new to robotics understand how the industry fits together in a few minutes, and let a robotics founder, PM, GTM lead, or technical investor spend an hour drilling without hitting a dead end.

Two people judge the result. A robotics insider opens it and thinks "these people understand the space." A newcomer opens it and thinks "I finally see how this all fits together." Design for both at once by making structure do the explaining.

Produce one coherent design system and the screens listed in Section 5. Prioritize real visual product design over written specification. Coding agents will implement directly from your output against fixture data, so be concrete about layout, hierarchy, and interaction, and use the fixture content in Section 7 so the mockups read as true.

## 1. Non-negotiable principles

**Render what is known.** The data model supports ~80 possible facts per robot; most robots will have 15–25. Never show an empty field, an "UNKNOWN" row, or a greyed-out section because the schema allows it. A profile with 20 good facts must look complete and intentional, not partially loaded. Sparse must look designed.

**No dead ends, many doors.** Do not design around one privileged path (robot → component → supplier → other robots). Every entity exposes several lateral exits: its category, its company, the technologies in it, the markets it serves, the places it is deployed, and the things it is compared against. When a relationship is known, an extra door appears; when it isn't, nothing is missing.

**Fact and judgment look different.** Sourced facts and analyst assessments (maturity, economics, adoption barriers, readiness) are both first-class content, and the eye must tell them apart instantly, everywhere, without reading a legend.

**"How do we know?" is always one interaction away, and quiet.** Every fact, metric, relationship, and judgment can open the Evidence Drawer, but the page must read as a robotics intelligence product first and an audit trail second. Evidence chips are visible by default only in the profile's intelligence rail, in the drawer, in Updates, and next to every analyst assessment. Everywhere else, evidence is a hover affordance or a small source glyph. The analyst marker is the deliberate exception: it is always inline, because fact-versus-judgment cannot live behind a hover.

**Every page answers a subset of nine questions**, in roughly this order: What is it? How does it work? Who builds it? Where is it used? Who buys it? How mature is it? How does it compare? What is changing? How do we know? Use this as the section grammar of every profile and explorer; never show all nine as labels.

**Structure over decoration.** No sci-fi HUD, no neon, no 3D robot art standing in for information, no endless identical card grids, no tiny unreadable graphs. Motion exists to preserve orientation during zoom and drill-down, not to impress.

## 2. Fixed vocabulary (use exactly these)

**Evidence class** (one chip, always paired with confidence):
`PRIMARY` official product page, datasheet, manual, filing, company announcement · `THIRD-PARTY` credible journalism, integrator case study, conference talk · `ACADEMIC` paper or benchmark · `DERIVED` computed from other facts · `ANALYST` our editorial assessment · `NOT AVAILABLE` used only inside the drawer, never on a page.

**Confidence**: `High` `Medium` `Low`. Words only, never decimals or percentages.

**Task / market maturity** (five ordinal stages, always tagged ANALYST, answers "how mature is robotic wind-blade repair?"): `Research` → `Pilot` → `Early commercial` → `Scaling` → `Mature`. Render as a five-step discrete indicator, never as a continuous bar or a percentage. Every maturity value has an authored rationale (see 5.8).

**Commercial stage** for robots (answers "can I buy and deploy the UR20 today?"): `Concept` `Prototype` `Pilot deployments` `Commercial` `Volume production`. This is a different question from task maturity; never merge the two scales or their visual treatment.

**Global navigation**: `Explore` `Markets` `Robots` `Companies` `Technology` `Atlas` `Updates`, plus a global command palette (⌘K) that searches entities, markets, tasks, and technologies and shows the entity type inline.

**Entity types** that get a profile: Robot, Company, Technology (a component class or software layer, e.g. "Harmonic drives", "VLA models"), Product (a specific component or software product, e.g. "Jetson Thor"), Market, Task, Deployment, Model, Benchmark, Place.

**Stack layers** (the Robot MRI). Eleven canonical layers, top to bottom, with embodiment-specific labels. Layers absent for an embodiment are omitted, not shown empty.

| Canonical layer | Humanoid | Drone | Wheeled AMR | Industrial arm |
|---|---|---|---|---|
| Intelligence | VLA / policy models | Mission autonomy | Fleet orchestration | Application software / programming |
| Planning | Task planning | Route & mission planning | Task & route planning | Motion planning |
| Perception | Perception | Perception / detection | Perception | Vision (if present) |
| State estimation | State estimation | State estimation / EKF | Localization & SLAM | — (omit) |
| Control | Whole-body control | Flight control | Motion control | Servo control / controller |
| Compute | Compute | Flight computer + companion compute | Compute | Controller cabinet / PLC |
| Sensors | Cameras, depth, IMU, F/T | Cameras, GNSS, IMU, LiDAR/radar | LiDAR, cameras, safety scanners | Encoders, F/T, safety |
| Actuation | Joint actuators | Motors, ESCs, propulsion | Drive motors | Joint modules & reducers |
| End effector / payload | Hands / grippers | Payload / gimbal / manipulator | Payload handling (lift, conveyor) | End effector / tooling |
| Power | Battery, BMS | Battery / hybrid | Battery, charging | Mains power |
| Mechanical | Frame, joints, legs | Airframe | Chassis | Links, base |

Safety is a cross-cutting band drawn alongside the stack, not a layer.

## 3. Design system

Dark theme only for V1, but legibility and hierarchy come first: a near-black ground, a restrained accent used only for interactive and selected states, and neutral greys for structure. The reference set for tone is Linear, Vercel, Stripe, Figma, and modern data terminals; the product should look like a serious instrument that someone in robotics would screenshot and share.

Typography carries the density: a tight type scale with a clear display size for entity names, a compact numeric style for specs and counts, and generous line height in prose sections. Grid: a 12-column desktop layout at 1440+ with a persistent left rail for navigation and a right rail reserved for the intelligence panel on profiles. Spacing is tighter inside data panels than between them so density reads as organized, not crowded.

Define these components once and reuse them everywhere: entity chip (type icon + name, clickable), evidence chip (class + confidence, plus its quiet hover/glyph form), analyst marker, maturity indicator, commercial-stage badge, "last checked" stamp, lateral-links strip ("Explore from here"), path bar (breadcrumb/history), section header with the question it answers as a muted eyebrow ("Where is it used"), and the Evidence Drawer.

Data visualization language: one consistent set of marks. Categorical color is reserved for embodiment (at most eight hues, muted, used the same way on Explore, Atlas, and Compare). Sequential encoding is used for maturity and density. Charts have direct labels, no legends where a label will do, and hover reveals the evidence chip for any plotted value.

## 4. Information architecture and depth behavior

Two kinds of movement. *Facets* (a stack layer, a task panel, a comparison cell, a source) open in place as focus states or drawers with the parent still visible. *Entities* navigate: clicking any entity chip goes to its profile, and there is no limit on hops. A path like Unitree G1 → Jetson Orin → edge compute → AMRs using edge compute → Locus → warehouse picking must feel natural if the data supports it. The path bar at the top of every view records the route taken and the lens in use, is clickable at every step, and collapses gracefully after five or six hops. Orientation is preserved by the path bar and by in-place facets, not by capping depth.

Newcomers enter through Explore and search; experts enter through the command palette and profiles. Both converge on the same profile template.

## 5. Screens

### 5.1 Explore (home)

Primary goal: understand what exists in robotics in under a minute, then choose a door.

Above the fold: a one-line product statement, the command palette as the dominant element, and the Universe directly below.

The Universe is a **nested-territories map**: the plane is partitioned into large regions by the current lens, regions are subdivided into districts, and districts contain entity marks sized by a chosen measure. Default lens is Embodiment (Humanoids, Industrial arms & cobots, AMRs & warehouse, Drones, Quadrupeds & legged, Autonomous vehicles, Software & AI, Components). A lens switcher (Embodiment · Industry · Technology · Geography · Maturity) re-partitions the same entities with an animated re-layout that keeps each mark's identity traceable. Size measure switcher: known deployments · number of robots · funding (where PRIMARY) · none. This is not a force-directed graph; the layout is deterministic and stable between visits.

Zoom levels: three. Region level shows region names and counts. District level shows companies as labeled marks with robot marks clustered around them. Entity level shows a hover card (name, type, one line, commercial stage or maturity, evidence quality) with a click that opens the profile. Wheel and pinch zoom; double-click a region to focus it; Escape to zoom out one level.

Also design **one challenger Explore concept** that is materially different from nested territories (for example a semantic landscape with labeled elevation, or a structured cluster canvas) while honoring the same requirements: deterministic layout, the same five lenses, three zoom levels, stable between visits, no force-directed hairball, no 3D as decoration. Present both at the same fidelity; we will choose after seeing them.

Filters appear only after the first zoom: commercial stage, country, maturity, has-stack-data. Below the Universe: a compact "What's changing" strip (five items from Updates) and three entry tiles for Markets, Robot MRI, and Compare, each showing one real example.

Sparse behavior: districts with fewer than three entities render as a single labeled mark, never as an empty box. Regions never show "0."

Fixture: use the Section 7 entity set; humanoids and warehouse should visibly be the densest districts.

### 5.2 Profile template (Robot primary, Company second state)

Primary goal: answer "what is it, how mature is it, and how do we know" before scrolling, then offer doors.

Above the fold, left to right: identity block (name, embodiment chip, company chip, country, product image slot), one-sentence description, commercial-stage badge, and the lateral-links strip. Task maturity does not appear on a robot profile; it belongs to tasks and markets. Right rail (the intelligence panel): evidence quality summary (counts by class), last checked, recent changes (count with a link into the timeline), known deployments count, related entities count. Nothing else above the fold.

Sections below, in order, each with its eyebrow question and each omitted entirely when empty: Overview (What is it) · Stack (How does it work; a compact MRI thumbnail that expands into 5.3) · Use cases and markets (Where is it used) · Deployments and customers (Who buys it) · Comparisons (How does it compare; a "compare with" affordance pre-filled with three peers) · Timeline (What is changing) · Sources (How do we know; grouped by class).

Specs are shown as a scannable grid of label/value pairs with a source glyph and the evidence chip on hover, never as a long two-column table. Group specs by the stack layer they belong to. The intelligence rail is where evidence quality is visible without hovering.

Company state: same skeleton; the identity block swaps to company facts (HQ, founded, ownership, funding class), the Stack section becomes Products (robots and components as entity chips grouped by embodiment), and Deployments become Customers and partners.

Fixtures: Unitree G1 as the robot, Figure AI as the company.

### 5.3 Robot MRI (stack explorer)

Primary goal: understand how this robot works, layer by layer, and jump from any layer to the technologies, suppliers, and peers behind it.

Layout: the robot's layers drawn as a vertical stack on the left using the embodiment-specific labels from Section 2; the safety band beside it. Each layer shows its known contents inline as entity chips (products or technology classes), with the evidence chip for the strongest source. Layers with no known contents still draw, with the layer name only and a muted style, because the stack itself is the explanatory object; this is the one place a known-empty layer is allowed, and it must not say "unknown."

Clicking a layer is a focus state, not navigation: the stack compresses to the left edge and the right two-thirds shows the layer detail in this order: known architecture (one paragraph, evidence-chipped), specific components and suppliers (entity chips, only if known), the technology class profile link, competing approaches (e.g. for Actuation: harmonic vs cycloidal vs planetary vs direct-drive, with which fixture robots use which), similar robots at this layer, and the evidence list. A cross-embodiment toggle shows the same canonical layer for a drone or an AMR so users see what changes and what doesn't.

Design the MRI for four robots to prove the layer table works: Unitree G1 (humanoid), Skydio X10 (drone), Locus Origin (AMR), Universal Robots UR20 (arm). Show at least two in the deliverable.

### 5.4 Market and Use-Case Explorer — Energy → Wind → Blade Repair

Primary goal: see where robotics is commercially real, where it is still a demo, and who is doing what; this screen is as important as the MRI.

Three-level hierarchy on one screen: a sector rail on the left (Manufacturing, Warehouse & logistics, Automotive, Energy, Utilities, Construction, Agriculture, Defense, Healthcare, Retail & service), a domain header (Wind) with a **task maturity board** across the top, and the selected task (Blade repair) as the main content.

The task maturity board is the signature visual: each task in the domain as a row with a five-step maturity indicator, the dominant robotics approach as a chip, and a count of vendors and known deployments. Every maturity value carries the ANALYST marker and opens the drawer to its rationale. For Wind, the rows are: Blade visual inspection, Tower and nacelle inspection, Blade cleaning, Contact NDT, Blade repair, Lightning-protection testing.

The task panel answers, in order: the incumbent process (rope-access technicians, platform access, turbine downtime); the analyst's one-paragraph "why we rate it this way" shown inline under the maturity indicator, with the ANALYST marker; robotics approaches as a small comparative visual (drone-based, blade crawler, rope/cable robot, aerial manipulator) with a maturity step and an example vendor each; technical requirements as chips (contact stability in wind, surface preparation and coating application, blade-edge localization, working at 80–120 m height); vendors and deployments as entity chips; target customers as a typed list (turbine OEMs, independent service providers, asset owners and operators); adoption barriers as analyst notes; adjacent tasks; related technologies. Economics appears only if a sourced or clearly-marked analyst figure exists, otherwise the section is absent.

Sparse behavior: a task with a maturity assessment but no known vendors still renders its row and its panel with the assessment and the incumbent process; that is a legitimate "whitespace" state and should feel like a finding, not a gap.

**Second state, at reduced size: Warehouse & Logistics → Pallet movement.** Same layout, different content, so the screen is provably not a wind product. Maturity board rows for the Warehouse domain: Each-picking assistance (Scaling), Pallet movement (Scaling), Case picking (Early commercial), Truck unloading (Pilot), Automated storage and retrieval (Mature). Pallet movement approaches: AMR with pallet jack or lift (Seegrid, Vecna, OTTO Motors), autonomous forklift retrofit or purpose-built (Fox Robotics, Third Wave Automation), fixed AS/RS with pallet handling (Symbotic). Incumbent: manual forklift operators. Technical requirements: pallet detection and pocket localization, safety-rated navigation among people, dock and trailer edge cases, fleet orchestration with the WMS. Adoption barriers: brownfield integration, safety certification, workflow variability, labor-model change. Customers: 3PLs, retailers, CPG manufacturers. Show this state small enough to prove the template generalizes and large enough to read.

### 5.5 Compare

Primary goal: decide between two to four things of the same type without reading a spreadsheet.

Entry: from any profile ("compare with"), from the command palette, or from Explore multi-select. Layout: entities as columns with identity headers; rows grouped by the stack layers for robots (so Actuation compares to Actuation) and by attribute family for technologies. Rows shown only where at least two columns have a value. Visual comparison wherever a number allows it: an inline range mark for payload, height, weight, runtime, price; discrete indicators for commercial stage; chips for categorical values. Differences are emphasized, agreement is de-emphasized. Hover on any cell shows its evidence chip; click opens the drawer.

Two fixtures: Figure 03 · Unitree G1 · Apptronik Apollo (robots), and NVIDIA Jetson Orin · Jetson Thor · Qualcomm robotics compute (products; use only attributes with PRIMARY sources and leave the rest out).

### 5.6 Global Robotics Atlas

Primary goal: see where robotics activity actually happens, not just where headquarters are.

Layout: a world map with cluster marks at country level, zooming to corridor and city level (Bay Area, Boston, Pittsburgh, Austin, NYC; Shenzhen, Shanghai, Hangzhou, Beijing, Suzhou; Odense, Munich, Zurich, Tokyo, Seoul as secondary). A layer toggle selects which relationship is plotted: HQ · R&D · Manufacturing · Deployments · Research institutions, with color following embodiment and the toggle changing what the marks mean. A right-side list mirrors the visible marks and updates with the viewport. Clicking a city opens a Place profile (entities there, grouped by type) using the same profile template.

Design all five layer toggles, but the fixture honestly shows HQ for the full entity set and Deployments only for the handful of anchors that have sourced locations (Figure at BMW Spartanburg, Symbotic at Walmart DCs, Spot in industrial sites, Agility Digit at GXO). Countries or layers with nothing to show fade rather than showing zero.

### 5.7 Updates

Primary goal: give a reason to return weekly.

A dense, filterable feed of change events generated from the data itself, not editorial news: new deployment, new robot, spec change, status change, new partnership, funding, benchmark result, new source added. Each item shows the entity chip, the change type, the before/after value where it applies, the evidence chip, and the date observed. Filters by change type, embodiment, and market. A "changed since your last visit" divider. Every item links into the entity and opens the drawer on click of the evidence chip.

### 5.8 Evidence Drawer (shared component)

Opens from any fact, metric, relationship, chart value, or analyst assessment anywhere in the product as a right-side drawer, parent view still visible.

For a sourced fact: the claim as a sentence; the evidence chip; the source with its type and link; publication date; observed date; last checked; a relevant excerpt; corroborating sources if any; a change history list ("Price: $16,000 since May 2024"). For a relationship: the two entities, the predicate in plain words, and the same evidence block.

For an analyst assessment the drawer is an argument, not a status readout. It carries the voice of a sharp strategy operator and has a fixed structure, designed as its own layout:

```
BLADE REPAIR                                   ANALYST · Pilot

Why we rate it this way
Robotic systems have demonstrated field repair and coating
workflows, but deployments remain limited and most structural
repair still depends on human rope-access teams.

What would move it to Early commercial
• repeated paid deployments across seasons
• multiple asset owners, not one pilot partner
• demonstrated repair quality accepted by OEM warranty terms
• reduced on-site intervention

Evidence considered
6 deployments · 3 vendors · 2 field trials · 4 sources   [chips]

Last reviewed · Suggest a correction
```

Give this layout the same design attention as the maturity board; the judgment is the content.

Design the drawer in three states: single PRIMARY source with High confidence; conflicting sources with Medium confidence; analyst assessment. Also design a loading state and a "no evidence recorded" state for the drawer, and an empty and a loading state for the profile template. No other states are required.

## 6. Interactions, motion, and responsiveness

Hover reveals; click commits. Every hover card and drawer has the entity chip that navigates. Zoom and lens changes animate in place with marks tracing their path so orientation is preserved; profile-to-facet transitions are a compress-and-reveal, never a page load. Transitions are short and easing is restrained. Keyboard: ⌘K everywhere, Escape closes the top-most facet or zooms out one level, arrow keys move through lists.

Desktop first at 1440 and 1920. Below 1024, landscapes (Explore, Atlas) become lists with the same filters, profiles stack the right rail below the identity block, and Compare scrolls horizontally. Do not compromise the desktop density to achieve this.

## 7. Fixture content (use this, do not invent beyond it)

Where a value is missing below, leave it out of the mockup. Dates and figures are given as claims with an evidence class and confidence; they are intended to be plausible and mostly correct at the level shown, and the "last checked" stamp in the mockups should read as a recent date.

**Companies** (name · HQ · type · note)
Figure AI · Sunnyvale, CA · humanoid OEM · Helix VLA model announced Feb 2025 (PRIMARY, High); Figure 02 deployed at BMW Spartanburg 2024 (PRIMARY/THIRD-PARTY, High); Figure 03 announced Oct 2025 (PRIMARY, High).
Unitree Robotics · Hangzhou, China · humanoid and quadruped OEM, also sells actuators (PRIMARY, High).
Apptronik · Austin, TX · humanoid OEM · Apollo; partnerships announced with Mercedes-Benz and GXO (PRIMARY, High); Google DeepMind collaboration announced Dec 2024 (PRIMARY, High).
Agility Robotics · Salem, OR · humanoid OEM · Digit; RaaS deployment with GXO announced 2024 (PRIMARY, High).
Tesla · Austin, TX · Optimus program (PRIMARY, Medium on any specific figure; use no numbers).
Boston Dynamics · Waltham, MA · Hyundai-owned · Spot, Atlas, Stretch (PRIMARY, High).
Ghost Robotics · Philadelphia, PA · quadruped OEM · Vision 60; majority acquired by LIG Nex1 (THIRD-PARTY, Medium).
FANUC · Oshino, Japan · industrial arms and CRX cobots; over one million robots installed (PRIMARY self-reported, High).
KUKA · Augsburg, Germany · industrial arms; Midea-owned (PRIMARY, High).
ABB Robotics · Zurich/Västerås · industrial arms and cobots (PRIMARY, High).
Universal Robots · Odense, Denmark · cobots; Teradyne-owned; UR3e/5e/10e/16e/20/30 (PRIMARY, High).
Locus Robotics · Wilmington, MA · warehouse AMRs; four billion picks milestone (PRIMARY self-reported, High).
Symbotic · Wilmington, MA · warehouse automation; public (SYM); Walmart regional DC program (PRIMARY via filings, High).
Amazon Robotics · North Reading, MA · one-million-robot fleet milestone announced 2025 (PRIMARY self-reported, High).
Seegrid · Pittsburgh, PA · autonomous pallet-handling AMRs and lift trucks (PRIMARY, High).
Vecna Robotics · Waltham, MA · autonomous pallet jacks and forklifts (PRIMARY, High).
Fox Robotics · Austin, TX · autonomous forklifts for trailer unloading (PRIMARY, Medium).
OTTO Motors · Kitchener, Canada · industrial AMRs incl. pallet movers; acquired by Rockwell Automation (PRIMARY, High).
Third Wave Automation · Union City, CA · autonomous forklift platform (PRIMARY, Medium).
Skydio · San Mateo, CA · autonomous drones; X10; enterprise and public-safety focus (PRIMARY, High).
DJI · Shenzhen, China · drones; Matrice enterprise line (PRIMARY, High).
SkySpecs · Ann Arbor, MI · autonomous drone blade inspection and analytics (PRIMARY, High).
Aerones · Riga, Latvia · robotic blade maintenance: cleaning, leading-edge protection, lightning-protection testing, inspection (PRIMARY, High).
BladeBUG · UK · blade-crawling inspection and repair robot; offshore trials (THIRD-PARTY, Medium).
Rope Robotics · Denmark · robotic blade repair and leading-edge maintenance (PRIMARY, Medium).
NVIDIA · Santa Clara, CA · Jetson Orin, Jetson Thor, Isaac platform (PRIMARY, High).
Qualcomm · San Diego, CA · robotics compute platforms (PRIMARY, High).
Physical Intelligence · San Francisco, CA · robotics foundation models; π0 released Oct 2024 (PRIMARY, High).
Open Robotics / ROS 2 · open-source middleware (PRIMARY, High).
Harmonic Drive · Japan · strain-wave reducers (PRIMARY, High).

**Robots** (spec-level; each value PRIMARY unless noted)
Unitree G1 · humanoid · ~1.32 m · ~35 kg · 23 DOF base, more with dexterous hands · ~2 h runtime · base price $16,000 (May 2024) · depth camera + 3D LiDAR · Jetson Orin NX on EDU variants · commercial stage: Commercial (sold broadly to research and developers).
Figure 03 · humanoid · Helix VLA (PRIMARY) · targets home and commercial (PRIMARY) · commercial stage: Pilot deployments (ANALYST, Medium) · no supplier data (omit actuation, gearbox, motor suppliers entirely).
Apptronik Apollo · humanoid · ~1.73 m · ~73 kg · ~25 kg payload · swappable battery · commercial stage: Pilot deployments (PRIMARY, High).
Boston Dynamics Spot · quadruped · ~32 kg · 14 kg payload · ~90 min runtime · commercial stage: Commercial; over 1,500 units deployed per company statement (PRIMARY self-reported, High).
Agility Digit · humanoid · tote-handling in logistics · commercial stage: Pilot deployments (PRIMARY, High).
Universal Robots UR20 · cobot arm · 20 kg payload · 1,750 mm reach · commercial stage: Volume production (PRIMARY, High).
FANUC CRX-10iA · cobot arm · 10 kg payload · commercial stage: Volume production (PRIMARY, High).
Locus Origin · warehouse AMR · picking assistance · commercial stage: Volume production (PRIMARY, High).
Skydio X10 · drone · onboard autonomy, multiple sensor payload options, NDAA-compliant positioning · commercial stage: Volume production (PRIMARY, High).
DJI Matrice 350 RTK · enterprise drone · commercial stage: Volume production (PRIMARY, High).
Seegrid Palion Lift · autonomous pallet-handling AMR · commercial stage: Commercial (PRIMARY, High).
Fox Robotics FoxBot · autonomous forklift for trailer unloading and pallet moves · commercial stage: Commercial (PRIMARY, Medium).

**Products / technologies**
NVIDIA Jetson Orin family (edge compute, PRIMARY); NVIDIA Jetson Thor (next-generation robotics compute, PRIMARY); Qualcomm robotics platforms (PRIMARY, use no benchmark numbers); Harmonic drives, cycloidal drives, planetary drives, quasi-direct-drive actuators (technology classes, ANALYST descriptions); ROS 2; NVIDIA Isaac Sim; π0 (VLA, ACADEMIC/PRIMARY); force-torque sensors (technology class).

**Deployments** (relationship · evidence)
Figure → BMW Spartanburg, SC (PRIMARY, High) · Agility Digit → GXO (PRIMARY, High) · Apollo → Mercedes-Benz pilot (PRIMARY, High) · Symbotic → Walmart regional DCs (PRIMARY filings, High) · Locus → multiple 3PL sites (PRIMARY self-reported, Medium on counts) · Spot → industrial inspection sites (THIRD-PARTY, Medium) · SkySpecs → utility-scale wind fleets (PRIMARY self-reported, Medium).

**Wind task maturity** (all ANALYST; rationale shown in drawer)
Blade visual inspection: Mature (drone-based inspection is standard practice across fleets). Tower and nacelle inspection: Scaling. Blade cleaning: Early commercial (Aerones and others operating commercially). Contact NDT: Pilot. Blade repair: Pilot (robotic leading-edge repair in field trials and early commercial work; most repair remains rope-access). Lightning-protection testing: Early commercial.

**Warehouse task maturity** (all ANALYST; rationale shown in drawer)
Each-picking assistance: Scaling (collaborative AMRs at thousands of sites; Locus and peers). Pallet movement: Scaling (autonomous pallet jacks and forklifts in repeated paid deployments across 3PLs and manufacturers; brownfield variability still limits penetration). Case picking: Early commercial. Truck unloading: Pilot (robotic trailer unloading in early customer sites, not yet routine). Automated storage and retrieval: Mature (decades of fixed AS/RS; Symbotic-style systems scaling in grocery distribution).

**Approaches for blade repair** (ANALYST)
Drone-based (inspection mature, contact work early) · Blade crawler (BladeBUG-type; Pilot) · Rope/cable-suspended robot (Aerones, Rope Robotics; Early commercial for cleaning and coating, Pilot for structural repair) · Aerial manipulator (Research; contact-stable manipulation from a multirotor at height is an open problem).

**Places**: Bay Area, Boston, Pittsburgh, Austin, NYC, Shenzhen, Shanghai, Hangzhou, Beijing, Suzhou, Odense, Munich, Zurich, Tokyo, Seoul.

## 8. Deliverables

One design system sheet (tokens, type scale, grid, the reusable components from Section 3). Screens 5.1 through 5.7 at 1440 desktop, with 5.1 shown as nested territories plus the one challenger concept, 5.2 shown in both Robot and Company states, 5.3 shown for at least two embodiments, and 5.4 shown in both the Wind and Warehouse states. The Evidence Drawer in its three content states (single PRIMARY source, conflicting sources, analyst assessment with rationale) plus loading and no-evidence. The profile empty and loading states. A one-page navigation map showing how the screens link, where the drawer can open from, and an example six-hop entity path with its path bar. Annotate only what is not obvious from the visuals: layout logic for the Explore map, the layer focus behavior in the MRI, the evidence visibility rule, and the rules for when a section or row is omitted.

Do not add an AI chat surface. Do not add a time-travel scrubber; the data model preserves history, and "last checked" and Updates are enough for V1. Do not design mobile-native versions of the landscapes.
