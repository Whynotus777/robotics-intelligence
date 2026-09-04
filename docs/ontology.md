# Ontology V0

Source of truth for enums and predicates is code: `packages/domain/src/enums.ts` and `packages/domain/src/predicates.ts`. Each registry entry declares subject types, typed value kind, allowed object types, canonical numeric unit, cardinality, and stack-layer rule; unknown predicates are rejected at seed and API boundaries. This page is the human-readable registry guide.

## Primitive
`entity + claim + relationship + evidence + time`. A relationship is a claim whose value is another entity. Entities carry a small typed core plus cached current-value columns derived from APPROVED claims (never written directly).

## Entity types
ORGANIZATION (roles derived from relationships: OEM, supplier, customer, research institution), ROBOT, ROBOT_FAMILY, COMPONENT_PRODUCT, SOFTWARE_PRODUCT, MODEL, TECHNOLOGY (a class; products are IS_INSTANCE_OF a technology), DATASET, BENCHMARK, PAPER, MARKET (sector or domain via CHILD_OF), TASK, APPROACH, DEPLOYMENT, PLACE.

## Claims
`subject`, `predicate`, exactly one of `value_text | value_number(+unit, is_approximate, min, max) | value_enum | object_entity`, `status ∈ PROPOSED|APPROVED|REJECTED|SUPERSEDED`, `valid_from`, `valid_to`, `observed_at`, `last_verified_at`, `stack_layer` (for USES_* predicates). Changing a fact closes the old claim and opens a new one.

## Evidence
`evidence(claim, source?, class ∈ PRIMARY|THIRD_PARTY|ACADEMIC|DERIVED|ANALYST, confidence ∈ HIGH|MEDIUM|LOW, excerpt, published_at, observed_at)`. NOT_AVAILABLE is an API-level report, never stored. ANALYST evidence has an `assessments` row (author, rationale, advance_criteria[], regress_criteria[], evidence_considered[], reviewed_at). DERIVED claims list inputs in `claim_dependencies`.

## Two scales, never merged
Task/market maturity: RESEARCH → PILOT → EARLY_COMMERCIAL → SCALING → MATURE (always ANALYST).
Robot commercial stage: CONCEPT → PROTOTYPE → PILOT_DEPLOYMENTS → COMMERCIAL → VOLUME_PRODUCTION.

## Stack
Eleven canonical layers (INTELLIGENCE … MECHANICAL) + SAFETY cross-cutting. `embodiment_layer_labels` maps (embodiment, layer) → label and applicability. Membership is a USES_PRODUCT / USES_TECHNOLOGY claim tagged with a layer; there is no stack table.

## Market / task
MARKET (sector) → MARKET (domain) → TASK. Tasks carry structured claims: HAS_INCUMBENT_PROCESS, HAS_MATURITY, HAS_APPROACH → APPROACH, REQUIRES_TECHNOLOGY, HAS_ADOPTION_BLOCKER, HAS_CUSTOMER_TYPE, ADJACENT_TO, HAS_ECONOMICS_NOTE. Vendors and deployments are derived from TARGETS_TASK and SERVES_TASK.

## Sources and change events
`sources` has canonical identity plus its 0b fetch state, reuse policy, cadence, priority and latest snapshot pointer; `source_snapshots` preserves fetch history. `change_events` is a derived read model whose only writers are the approve/supersede paths.

## Predicate families
Organization predicates are BUILDS, DEVELOPS, PROVIDES, TARGETS_MARKET, TARGETS_TASK, PARTNERS_WITH, ACQUIRED, PUBLISHES, HQ_AT, RND_AT, MANUFACTURES_AT, FUNDED, and FOUNDED_ON. Robot predicates include stack membership (USES_PRODUCT and USES_TECHNOLOGY), generation/family links, task/competition/model links, benchmark scores, and physical/commercial scalar claims. Deployments link robot, customer, operator, place and task. Market/task predicates model hierarchy, maturity, approaches, technologies, incumbents, customer types, blockers, adjacency and economics. Product/model predicates connect instances, makers, papers, benchmarks and datasets. The complete machine-readable registry is intentionally adjacent to validation code rather than copied into prose.

## Depth tier
ANCHOR | STANDARD | DISCOVERY — backend metadata only, never shown.
