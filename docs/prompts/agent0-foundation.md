# Agent 0 — Foundation and data contract (amended)

You are Agent 0 for a new robotics intelligence product: an interactive strategy map for robotics where technical architecture and commercial reality coexist. Your job is to establish the canonical data contract and foundation that every subsequent frontend, visualization, ingestion, research, and API agent builds against, so that several agents can work in parallel without independently inventing schemas, evidence semantics, entity shapes, API contracts, or fixture formats.

Do not build the application. Do not implement the designed screens. Do not scrape anything. Do not add infrastructure because it might be useful later. Prefer boring, readable, explicit.

This work is split into two milestones. **Milestone 0a** (contracts) unblocks the web, visualization, and API agents and must land first. **Milestone 0b** (pipeline substrate) unblocks the ingestion agent and lands second. Finish and commit 0a before starting 0b.

---

## Product context (read once)

Users are technically sophisticated operators (founders, PMs, GTM leads, technical investors, strategy teams) who want to understand robots, companies, technologies, components, software, models, markets, tasks, deployments, customers, suppliers, benchmarks, geography, change over time, and the evidence behind all of it. The product is deliberately broader than humanoids: initial embodiments are humanoids, industrial arms, cobots, AMRs, drones, quadrupeds, and other mobile robots; initial markets are manufacturing, warehouse and logistics, automotive, energy, utilities, construction, agriculture, defense, healthcare, retail and service.

Two signature experiences depend on this contract equally: the **Robot MRI** (a robot decomposed into canonical stack layers) and the **Market / Task Explorer** (sector → domain → task, with incumbent process, competing robotics approaches, maturity, vendors, customers, blockers, and the analyst's reasoning).

**Render what exists.** The UI never shows UNKNOWN fields. A robot with 20 populated claims out of 80 possible is normal. Missing relationships must never cause a schema or API failure.

---

## Decisions already made (do not re-litigate; implement)

**Canonical primitive.** `entity + claim + relationship + evidence + time`. A relationship is a claim whose value is another entity.

**Typed core vs claims.** Every entity has a small typed core: `id`, `slug`, `entity_type`, `name`, `short_description`, `primary_embodiment` (robots), `country_code`, `depth_tier`, timestamps. Everything substantive is a claim. Entities also carry a few **cached current-value columns** (for robots: `commercial_stage`, `height_m`, `mass_kg`, `payload_kg`, `list_price_usd`; for tasks: `maturity`) that are **derived from approved claims by a recompute job and never written directly**. Cached columns exist for filtering and sorting only; the claim is the source of truth.

**Claim values are typed columns, not JSON.** A `claims` row has `subject_entity_id`, `predicate`, and exactly one of: `value_text`, `value_number` (+ `unit`, `is_approximate`, `value_min`, `value_max`), `value_enum`, `object_entity_id`. A checked-in **predicate registry** (`packages/domain/predicates.ts` and `docs/ontology.md`) defines for each predicate: subject types, value kind, allowed object types, unit, cardinality (one/many), and whether it is a stack membership predicate. Unknown predicates are rejected by validation.

**Units.** Numeric claims store canonical SI (`m`, `kg`, `N·m`, `W`, `Wh`, `s`, `USD`). `is_approximate` is a real flag, shown by the UI as "~". Conversions happen at ingest, not at read.

**Sources (minimal, in 0a).** `sources` holds canonical source identity: `id`, `url`, `canonical_url`, `publisher`, `title`, `source_kind` (PRODUCT_PAGE, DATASHEET, PRESS_RELEASE, FILING, PAPER, NEWS, CASE_STUDY, TALK, OTHER), `published_at`, `language`. 0b extends this same table with operational fields (hash, snapshots, cadence, next check, license policy); do not invent a temporary source model.

**Evidence.** `evidence` rows link a claim to a `source` with `evidence_class` ∈ {PRIMARY, THIRD_PARTY, ACADEMIC, DERIVED, ANALYST}, `confidence` ∈ {HIGH, MEDIUM, LOW}, `excerpt`, `published_at`, `observed_at`. A claim may have zero, one, or many evidence rows, and corroborating or conflicting rows coexist. NOT_AVAILABLE is not stored; it is what the API reports when a claim has no evidence. No decimal confidence anywhere. ANALYST and DERIVED evidence rows have a nullable `source_id`.

**Derived claims** point at their inputs: `claim_dependencies (derived_claim_id, input_claim_id)`. Any claim with DERIVED evidence must have ≥1 dependency row, so counts, rankings, and computed economics can be recomputed and explained.

**Analyst assessments** are ordinary claims (e.g. `task HAS_MATURITY PILOT`, `robot HAS_COMMERCIAL_STAGE PILOT_DEPLOYMENTS`, `task HAS_ADOPTION_BLOCKER …`) whose evidence row is class ANALYST, plus one extension table `assessments` keyed by evidence id: `author`, `rationale` (text), `advance_criteria` (text[]), `regress_criteria` (text[]), `evidence_considered` (claim ids), `reviewed_at`, `notes`. Never stuff the rationale into a claim string.

**Two maturity scales, never merged.** Task/market maturity: RESEARCH, PILOT, EARLY_COMMERCIAL, SCALING, MATURE. Robot commercial stage: CONCEPT, PROTOTYPE, PILOT_DEPLOYMENTS, COMMERCIAL, VOLUME_PRODUCTION. Different predicates, different enums, different cached columns.

**Time.** Every claim has `valid_from`, `valid_to` (nullable), `observed_at`, `last_verified_at`; evidence has `published_at`. A changed fact closes the old claim (`valid_to`) and opens a new one; nothing is overwritten. `claims.status` ∈ {PROPOSED, APPROVED, REJECTED, SUPERSEDED}; public API queries see only APPROVED with `valid_to IS NULL` unless an `as_of` parameter is given.

**Organizations.** One `entity_type = ORGANIZATION` with roles derived from relationships (BUILDS → OEM, PROVIDES → supplier, DEPLOYS → customer, PUBLISHES → research institution). No separate Company/Customer/Supplier types.

**Product hierarchy.** `ROBOT`, `COMPONENT_PRODUCT`, `SOFTWARE_PRODUCT`, and `MODEL` are distinct entity types sharing the same claim machinery; `TECHNOLOGY` is a class (harmonic drives, VLA models, force-torque sensors) and a product `IS_INSTANCE_OF` a technology. `ROBOT_FAMILY` is a real entity type (e.g. "Unitree G1 series", "Figure humanoids"); a robot is `MEMBER_OF_FAMILY → ROBOT_FAMILY`, which is what generations, timelines, and family-level comparisons hang off.

**Stack model.** No separate stack table. Stack membership is the claims `robot USES_PRODUCT x` or `robot USES_TECHNOLOGY y` with a `stack_layer` column ∈ the eleven canonical layers {INTELLIGENCE, PLANNING, PERCEPTION, STATE_ESTIMATION, CONTROL, COMPUTE, SENSORS, ACTUATION, END_EFFECTOR_PAYLOAD, POWER, MECHANICAL} plus SAFETY as cross-cutting. A small `embodiment_layer_labels` table maps (embodiment, canonical layer) → display label and whether the layer applies (e.g. STATE_ESTIMATION does not apply to INDUSTRIAL_ARM). `GET /robots/:slug/stack` returns layers in canonical order with embodiment labels, omitting non-applicable layers, and including applicable layers even when empty (the MRI draws them muted).

**Market/task model.** `MARKET` (sector) → `MARKET` (domain, via `CHILD_OF`) → `TASK` (via `BELONGS_TO_MARKET`). Tasks carry structured claims rather than a description dump: `HAS_INCUMBENT_PROCESS` (text), `HAS_MATURITY` (enum, ANALYST), `HAS_APPROACH` (→ `APPROACH` entity, e.g. "Rope/cable-suspended robot", itself with `HAS_MATURITY` and `USES_EMBODIMENT`), `REQUIRES_TECHNOLOGY` (→ TECHNOLOGY), `HAS_ADOPTION_BLOCKER` (text, ANALYST), `HAS_CUSTOMER_TYPE` (text), `ADJACENT_TO` (→ TASK), `HAS_ECONOMICS_NOTE` (text, evidence-classed). Vendors and deployments are derived from `organization TARGETS_TASK` and `deployment SERVES_TASK`.

**Depth tier** is backend metadata on entities (ANCHOR, STANDARD, DISCOVERY), never shown in the UI; used for editorial prioritization, refresh cadence, and a derived `completeness` score.

**Geography.** `PLACE` entities with `country_code`, `admin_region`, `city`, `lat`, `lng`, `cluster_label` (e.g. "Bay Area", "Shenzhen"). Relationships `HQ_AT`, `RND_AT`, `MANUFACTURES_AT`, `OCCURS_AT` (deployments), `LOCATED_AT`. Plain lat/lng columns; no PostGIS in V1.

**Stack.** PostgreSQL 16; Drizzle ORM and drizzle-kit migrations (SQL stays visible); TypeScript everywhere; Zod schemas are the single source of contract truth with types inferred via `z.infer`; pnpm workspaces; Vitest; Next.js for `apps/web` (Agent 1 scaffolds it, you only reserve the folder). Local dev: `docker compose up db`. Hosted: Neon, one branch per agent. No Neo4j, no Elasticsearch, no vector DB, no auth beyond a seeded reviewer identity, no billing, no AI query.

**Fixtures are generated, not hand-written.** Seed data lives as human-editable YAML in `packages/seed/data/**` (one file per entity, claims inline with their evidence). `pnpm seed` loads YAML → Postgres. `pnpm fixtures` then runs the real API handlers against the seeded database and writes the responses to `packages/fixtures/generated/**` as JSON, validated against the Zod contracts. Frontend agents import fixtures through a `DataProvider` interface with two implementations (`FixtureProvider`, `HttpProvider`) so screens never know which one they are on. If a type changes, regenerating fixtures is the only way to update them.

---

## Milestone 0a — contracts

### Relationships (predicate registry, improve but keep these)

Organization: BUILDS → Robot · DEVELOPS → Model/Software · PROVIDES → ComponentProduct/Software · TARGETS_MARKET → Market · TARGETS_TASK → Task · PARTNERS_WITH → Organization · ACQUIRED → Organization · HQ_AT / RND_AT / MANUFACTURES_AT → Place · FUNDED (event claim with value_number USD, published_at).
Robot: USES_PRODUCT → ComponentProduct/Software (with stack_layer) · USES_TECHNOLOGY → Technology (with stack_layer) · TARGETS_TASK → Task · COMPETES_WITH → Robot · MEMBER_OF_FAMILY → RobotFamily · SUCCEEDS → Robot (generation) · CONTROLLED_BY → Model · SCORES_ON → Benchmark (value_number + unit).
Deployment: USES_ROBOT → Robot · DEPLOYED_BY → Organization (customer) · OPERATED_BY → Organization (vendor/integrator) · OCCURS_AT → Place · SERVES_TASK → Task · HAS_SCALE (value_number units) · BEGAN (valid_from).
Product/Technology: IS_INSTANCE_OF → Technology · COMPETES_WITH → same type · MADE_BY → Organization.
Model/Paper: INTRODUCED_BY → Paper · SCORES_ON → Benchmark · TRAINED_ON → Dataset.
Market/Task: CHILD_OF → Market · BELONGS_TO_MARKET · HAS_APPROACH · REQUIRES_TECHNOLOGY · ADJACENT_TO, plus the scalar task predicates above.
Scalar robot predicates (minimum): HAS_HEIGHT (m), HAS_MASS (kg), HAS_PAYLOAD (kg), HAS_DOF (count), HAS_RUNTIME (s), HAS_REACH (m), HAS_LIST_PRICE (USD), HAS_COMMERCIAL_STAGE (enum), HAS_EMBODIMENT (enum), ANNOUNCED_ON (date).

### API contracts (Zod schemas + sample responses; implement handlers only as far as `pnpm fixtures` needs them)

`GET /entities/:slug` → identity core, cached values, claims grouped by predicate with evidence summary (`{class, confidence, source_count}`) and `has_evidence`, relationships grouped by predicate with target entity chips, lateral links (categories, company, technologies, markets, places, peers), intelligence rail (`evidence_summary`, `last_verified_at`, `recent_change_count`, `deployment_count`, `related_count`). Omits empty groups.
`GET /search?q=` → ranked `{entity chip, entity_type, match_field}` over names, aliases, descriptions, markets, tasks, technologies (Postgres `tsvector` + trigram).
`GET /explore?lens=embodiment|market|technology|geography|maturity&measure=deployments|robots|none` → **partition tree**: `{lens, regions: [{id, label, count, districts: [{id, label, count, entities: [{chip, measure_value, is_primary_membership}]}]}]}`. Under the technology and market lenses an entity may appear in several districts; `is_primary_membership` marks the one the layout should anchor. Counts are of distinct entities.
`GET /robots/:slug/stack` → `{robot chip, embodiment, layers: [{canonical, label, applies, items: [{entity chip, kind: product|technology, evidence_summary}], architecture_note?}], safety: [...]}` in canonical order.
`GET /tasks/:slug` → market path, maturity with assessment (rationale, advance criteria, evidence considered), incumbent process, approaches (each with maturity and example vendors), required technologies, vendors, deployments, customer types, blockers, adjacent tasks; empty sections omitted.
`GET /markets/:slug` → children and a task maturity board `[{task chip, maturity, dominant_approach, vendor_count, deployment_count}]`.
`POST /compare {slugs[]}` → columns (entity chips) and rows grouped by stack layer or attribute family, rows present only where ≥2 columns have values, numeric cells with unit and approximate flag, each cell carrying `claim_id`.
`GET /atlas?layer=hq|rnd|manufacturing|deployments|research&bbox=` → marks `{place, lat, lng, entities: [chip], embodiment_mix}` and a mirrored list.
`GET /updates?since=&type=&embodiment=&market=` → change events with entity chip, type, before/after, evidence summary, observed_at.
`GET /claims/:id/evidence` → the drawer payload: claim sentence, evidence rows, corroborating/conflicting flag, change history (previous claims for same subject+predicate), and for ANALYST evidence the full assessment.
All responses accept `as_of` (date) to resolve claims valid at that time; default now.

### Seed pack (real, representative, sparse where reality is sparse; do not invent supplier relationships)

Robots: Unitree G1, Figure 03 (deliberately few claims), Apptronik Apollo, Universal Robots UR20, FANUC CRX-10iA, Locus Origin, Seegrid Palion Lift, Fox Robotics FoxBot, Skydio X10, DJI Matrice 350 RTK, Boston Dynamics Spot, Agility Digit.
Organizations: Unitree, Figure AI, Apptronik, Agility, Boston Dynamics, Universal Robots, FANUC, KUKA, ABB, Locus, Symbotic, Amazon Robotics, Seegrid, Vecna, Fox Robotics, OTTO Motors, Third Wave, Skydio, DJI, SkySpecs, Aerones, BladeBUG, Rope Robotics, NVIDIA, Qualcomm, Physical Intelligence, Harmonic Drive, BMW, GXO, Mercedes-Benz, Walmart.
Products/technologies: Jetson Orin NX, Jetson Thor, ROS 2, Isaac Sim, π0, Helix, harmonic drives, cycloidal drives, planetary drives, quasi-direct-drive actuators, force-torque sensors, 3D LiDAR, depth cameras, VLA models.
Markets/tasks: Energy → Wind → {Blade visual inspection, Tower and nacelle inspection, Blade cleaning, Contact NDT, Blade repair, Lightning-protection testing}; Warehouse & Logistics → Material movement → {Pallet movement, Each-picking assistance, Case picking, Truck unloading, AS/RS}. Approaches for Blade repair (drone-based, blade crawler, rope/cable robot, aerial manipulator) and Pallet movement (AMR pallet jack/lift, autonomous forklift, AS/RS pallet handling), each with ANALYST maturity and rationale.
Deployments: Figure → BMW Spartanburg; Agility Digit → GXO; Apollo → Mercedes-Benz pilot; Symbotic → Walmart DCs; Spot → industrial inspection (THIRD_PARTY, MEDIUM); SkySpecs → utility-scale wind fleets.
Places: Bay Area, Boston, Pittsburgh, Austin, NYC, Shenzhen, Shanghai, Hangzhou, Beijing, Suzhou, Odense, Munich, Zurich, Tokyo, Seoul, Spartanburg, Riga, Ann Arbor.
Use the values and evidence classes from the product/design brief's fixture pack. Where a value is uncertain, mark confidence MEDIUM or omit it. Every ANALYST claim needs a rationale and advance criteria.

### Validation (Vitest, run by `pnpm check` with typecheck)

1. Every APPROVED non-ANALYST claim has ≥1 evidence row. 2. Every ANALYST evidence row has an `assessments` row with rationale, author, reviewed_at. 3. Enum validity for evidence class, confidence, maturity, commercial stage, stack layer, entity type, predicate. 4. Predicate registry conformance: subject type, value kind, object type, cardinality, unit. 5. Relationship endpoints exist. 6. `valid_to >= valid_from`. 7. Slug uniqueness; no two entities with the same normalized name unless aliased. 8. Cached current-value columns equal the recompute from APPROVED claims. 9. Non-APPROVED claims never appear in any public API response. 10. Superseding a claim preserves the prior row. 11. Every generated fixture parses against its Zod schema. 12. Non-applicable stack layers never carry claims for that embodiment. Add invariants you discover.

### Change events (read model in 0a; automatic generation in 0b)

`change_events` table: `id`, `event_type` ∈ {ENTITY_CREATED, PRODUCT_LAUNCHED, DEPLOYMENT_ADDED, CLAIM_CHANGED, COMMERCIAL_STAGE_CHANGED, MATURITY_CHANGED, PARTNERSHIP_ADDED, BENCHMARK_RESULT_ADDED, FUNDING_EVENT, SOURCE_ADDED}, `entity_id`, `before_claim_id` (nullable), `after_claim_id` (nullable), `observed_at`, `summary`. In 0a, seed a handful of legitimate historical events from the seed pack (e.g. Figure 03 announced, Agility–GXO deployment added, G1 price set) so `GET /updates` returns real rows and fixtures generate. Hand-seeded events are the exception for 0a only; 0b makes the approve/supersede path the sole writer.

### Graph projection

`projectGraph({lens, filter, as_of}) → {nodes: GraphNode[], edges: GraphEdge[]}` derived from relational data, where edges carry predicate, `has_evidence`, `confidence_max`, `valid_from/to`, and a `weight` hint. A projection, never storage.

### Example queries (checked-in, runnable)

All humanoids; robots using NVIDIA compute; tasks in Wind with maturity; organizations targeting pallet movement; deployments for an organization; evidence for a claim; changes in the last 7 days; MRI for Unitree G1; robots sharing a stack technology; Compare G1 / Apollo / Figure 03.

### 0a deliverables

`docs/adr-0001-foundation.md` (storage, entity/claim/relationship/evidence/temporal/assessment decisions, why no graph DB), `docs/ontology.md` (entities, predicate registry, enums, examples), `docs/data-contract.md` (API shapes, fixture flow, DataProvider), working migrations, `packages/domain` (Zod schemas, enums, predicate registry, inferred types), `packages/api-contracts` (route schemas + sample responses), `packages/seed` (YAML + loader), `packages/fixtures` (generated JSON + `FixtureProvider`), tests, projection, example queries, README with one setup sequence (`pnpm i && docker compose up -d db && pnpm db:migrate && pnpm seed && pnpm fixtures && pnpm check`). No unstated manual step.

---

## Milestone 0b — pipeline substrate (after 0a is committed)

**Source registry**: extend the 0a `sources` table (do not replace it) with license/reuse policy (VERBATIM_OK, SUMMARY_ONLY, LINK_ONLY), fetched_at, content_hash, extraction_status, refresh_cadence ∈ {DAILY, WEEKLY, MONTHLY, MANUAL, NEVER}, next_check_at, priority, snapshot pointer. `source_snapshots` keep history.

**Candidate claims** are rows in the same `claims` table with `status = PROPOSED` and an `origin` ∈ {MANUAL, EXTRACTED, DERIVED}; no parallel schema. `review_actions` records reviewer, action ∈ {APPROVE, EDIT, REJECT}, timestamp, resulting claim id, reason. Approval sets APPROVED and triggers recompute of cached columns and a change event. Design so a reviewer sees claim sentence + evidence excerpt + source and acts in one call; do not build the UI.

**Change events** become derived-only: the approve/supersede path is the sole writer to the 0a `change_events` table, mapping predicate transitions to event types (HAS_COMMERCIAL_STAGE → COMMERCIAL_STAGE_CHANGED, HAS_MATURITY → MATURITY_CHANGED, new DEPLOYMENT entity → DEPLOYMENT_ADDED, etc.). Remove the 0a hand-seeding path once this exists.

**Entity resolution, minimum viable**: `entity_aliases` (alias, normalized), `external_ids` (system, id), a normalize function (case, punctuation, legal suffixes A/S, Inc., GmbH, Co. Ltd.), a resolver that returns exact alias match or ranked candidates, and a manual `mergeEntities(from, to)` that re-points claims and keeps the alias. No ML.

**Scheduler contract**: a `dueSources(now)` query and a worker interface `fetch → snapshot → hash → (unchanged ? stop : extract → resolve → propose)`. Implement `dueSources` and the interfaces; the ingestion agent implements fetch/extract.

Add tests: PROPOSED claims invisible publicly; approve path writes review action + change event + cache recompute; hash-unchanged sources produce no work; alias resolution examples ("Universal Robots", "UR", "Universal Robots A/S" → one entity).

---

## Repo structure and ownership

```
/apps/web                 Agent 1 (Next.js shell, routes, composition)
/packages/viz             Agent 2 (pure visualization components consuming contract types; no data fetching)
/packages/domain          Agent 0 only after this milestone (schemas, enums, predicate registry, types)
/packages/api-contracts   Agent 0 only (route Zod schemas, samples)
/packages/db              Agent 0 → Agent 4 (Drizzle schema, migrations, queries)
/packages/api             Agent 4 (handlers, search, projections)
/packages/seed            Agent 0 → editorial (YAML data, loader)
/packages/fixtures        generated; never hand-edited
/packages/ingestion       Agent 3 (fetch, extract, propose)
/packages/review          Agent 5 later
/docs                     adr-*.md, ontology.md, data-contract.md, ownership.md
```

Changes to `domain` or `api-contracts` after 0a go through a PR labeled `contract-change` that regenerates fixtures in the same PR. Write `docs/ownership.md` stating this. Prefer many small files over few large ones so concurrent agents rarely touch the same file.

## Success criteria

A new developer initializes the repo with one command sequence. The seeded database holds entities, claims, relationships, evidence, analyst assessments, and temporal records across at least five embodiments and two market hierarchies. A frontend agent can build screens from generated fixtures without inventing shapes. An API agent can expose data without schema changes. An ingestion agent has a PROPOSED-claim target. Robot → organization → technology → task → deployment → place traverses where evidence exists and fails nowhere when it doesn't. Analyst judgments are structurally distinct from sourced facts. Facts change without losing history. Every published sourced claim traces to evidence. Every choice you face: pick the option that makes these simpler.

If a repository already exists, inspect it and adapt to its conventions rather than imposing this structure blindly.
