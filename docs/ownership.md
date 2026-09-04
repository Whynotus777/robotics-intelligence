# Ownership and change rules

| Path | Owner | Notes |
|---|---|---|
| `packages/domain` | Agent 0 | Enums, claim/entity/evidence schemas, predicate registry. Contract-change PRs only. |
| `packages/api-contracts` | Agent 0 | Route Zod schemas. Any change regenerates fixtures in the same PR. |
| `packages/db` | Agent 0 → Agent 4 | Drizzle schema + migrations. |
| `packages/api` | Agent 4 | Handler functions, search, projections. No HTTP server until needed. |
| `packages/seed` | Agent 0 → editorial | Human-editable YAML. Analyst rationale lives here and is reviewed by a human. |
| `packages/fixtures` | generated | Never hand-edited. `pnpm fixtures` is the only writer. |
| `packages/viz` | Agent 2 | Pure components; props are contract types; no fetching, no routing. |
| `apps/web` | Agent 1 | Next.js shell; composition only. Data via `DataProvider` (fixture or http). |
| `packages/ingestion` | Agent 3 | Starts after 0b. Writes only `status=PROPOSED` claims. |
| `packages/review` | Agent 5 | Later. |

Rules: (1) a PR that touches `domain` or `api-contracts` is labeled `contract-change` and includes regenerated fixtures; (2) no agent edits another agent's package without a PR; (3) prefer many small files so concurrent agents rarely collide; (4) the UI never renders UNKNOWN — absence is absence.
