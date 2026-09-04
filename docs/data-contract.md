# Data contract

Schemas live in `packages/api-contracts/src/routes/*`. Fixtures in `packages/fixtures/generated/*` are produced by running the handlers against the seeded DB and validating against these schemas; they are never hand-written.

| Route | Purpose | Screen |
|---|---|---|
| `GET /entities/:slug` | identity core, claims by predicate with evidence summary, relationships by predicate, lateral links, intelligence rail; empty groups omitted | Profile |
| `GET /search?q=` | ranked entity chips with match field | Command palette |
| `GET /explore?lens=&measure=` | partition tree `regions → districts → entities` with `is_primary_membership` | Explore (both concepts) |
| `GET /explore/stack-matrix?lens=` | lens columns × canonical stack-layer rows with technology/product cells and robot counts | Explore challenger |
| `GET /robots?embodiment=` | filtered robot entity chips | Robot directory |
| `GET /robots/:slug/stack` | canonical layers with embodiment labels; non-applicable omitted, applicable-but-empty included | Robot MRI |
| `GET /tasks/:slug` | market path, maturity + assessment, incumbent, approaches, requirements, vendors, deployments, customers, blockers, adjacent | Market explorer |
| `GET /markets/:slug` | children + task maturity board | Market explorer |
| `POST /compare` | columns + rows grouped by layer/attribute; rows only where ≥2 values; cells carry `claim_id` | Compare |
| `GET /atlas?layer=&bbox=` | place marks with entity chips and embodiment mix | Atlas |
| `GET /updates?since=&type=` | change events with before/after and evidence summary | Updates |
| `GET /claims/:id/evidence` | drawer payload incl. change history and full assessment for ANALYST | Evidence drawer |
| `projectGraph()` | nodes/edges projection (not storage) | lateral navigation |

All routes accept `as_of` (date). Public routes only ever see APPROVED claims.

Claims may carry a short optional `qualifier`; every claim projection preserves it. Entity cores may carry `image_url` and `image_credit`. Task and market payloads include an `intelligence_rail`; maturity-board rows may add `deployment_note`, and stack layers include `competing_technologies`.

Frontend access goes through `DataProvider` with `FixtureProvider` (generated JSON) and `HttpProvider` (later). Screens must not know which is in use.
