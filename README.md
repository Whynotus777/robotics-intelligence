# robotics-intelligence

An interactive strategy map for robotics where technical architecture and commercial reality coexist.

**Status:** scaffolding + contracts (Milestone 0a in progress). Nothing here serves traffic yet.

## What exists now
- `packages/domain` — enums (evidence class, confidence, task maturity, robot commercial stage, stack layers, entity types), claim/entity/evidence Zod schemas, and the **predicate registry** (`src/predicates.ts`, the source of truth for relationships and scalar facts).
- `packages/api-contracts` — Zod request/response schemas for every route in `docs/data-contract.md`. Frontend and visualization work builds against these types, via generated fixtures.
- `docs/` — ADR placeholders, ontology, data contract, ownership rules, and the two prompts that define the product (`docs/prompts/`).

## Setup (once Milestone 0a lands)
```
pnpm i
docker compose up -d db            # or any Postgres 16 at DATABASE_URL
cp .env.example .env
pnpm db:migrate && pnpm seed && pnpm fixtures && pnpm check
```

## Workstreams
See `docs/ownership.md`. Agent 0 (foundation) → Agents 1 (web), 2 (viz), 4 (api) in parallel → Agent 0b (pipeline) → Agent 3 (ingestion).
