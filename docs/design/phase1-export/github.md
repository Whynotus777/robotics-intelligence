repo: Whynotus777/robotics-intelligence
branch: main
path: packages/domain, packages/api-contracts, docs

## Last sync
date: 2026-09-04T16:55:35Z

### Updated in this project
- Read enums (embodiments, maturity, commercial stage, evidence class, layers) to match the design vocabulary
- Read explore/stack/task/entity API contracts to shape screen data
- Built Phase 1 design canvas (system sheet, Explore ×2, Robot profile, MRI, Market explorer, Evidence Drawer)

## Screen map
| Screen | Repo files |
|---|---|
| Design system sheet | packages/domain/src/enums.ts, packages/domain/src/evidence.ts |
| Explore (territories + stack-first) | packages/api-contracts/src/routes/explore.ts, packages/domain/src/enums.ts |
| Robot profile | packages/api-contracts/src/routes/entity.ts |
| Robot MRI | packages/api-contracts/src/routes/stack.ts, packages/domain/src/layers.ts |
| Market explorer | packages/api-contracts/src/routes/task.ts, docs/ontology.md |
| Evidence Drawer | packages/domain/src/evidence.ts, packages/api-contracts/src/routes/claim-evidence.ts |
