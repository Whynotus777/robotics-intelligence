# robotics-intelligence

An interactive strategy map for robotics where technical architecture and commercial reality coexist.

**Status:** Milestone 0a — foundation and data contract. The repository provides a seeded relational read model and generated fixtures; it deliberately does not provide application screens or ingestion.

## What exists now
- `packages/domain` — enums (evidence class, confidence, task maturity, robot commercial stage, stack layers, entity types), claim/entity/evidence Zod schemas, and the **predicate registry** (`src/predicates.ts`, the source of truth for relationships and scalar facts).
- `packages/api-contracts` — Zod request/response schemas for every route in `docs/data-contract.md`. Frontend and visualization work builds against these types, via generated fixtures.
- `docs/` — ADR placeholders, ontology, data contract, ownership rules, and the two prompts that define the product (`docs/prompts/`).

## Setup
```
pnpm i
docker compose up -d db
pnpm db:migrate
pnpm seed
pnpm fixtures
pnpm check
```

`DATABASE_URL` defaults to the local compose database in `.env`. The generated files under `packages/fixtures/generated/` are build output and are never edited by hand. `pnpm queries` runs the checked-in contract examples against the same database.

## Workstreams
See `docs/ownership.md`. Agent 0 (foundation) → Agents 1 (web), 2 (viz), 4 (api) in parallel → Agent 0b (pipeline) → Agent 3 (ingestion).
