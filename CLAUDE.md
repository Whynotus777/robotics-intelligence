# robotics-intelligence — agent operating rules

You are one of several coding agents working in parallel. You have broad autonomy (see `.claude/settings.json`); in exchange, stay inside these bounds.

## Bounds
- Work only in the packages you own (see `docs/ownership.md`). Changes to `packages/domain` or `packages/api-contracts` must regenerate fixtures (`pnpm fixtures`) in the same commit and be called out in the commit message with `contract-change:`.
- Pushing to `main` is allowed at this stage. Keep commits small and green (`pnpm check` passes before every push). Pull/rebase before pushing; never force-push.
- Never hand-edit `packages/fixtures/generated`.
- Never store decimal confidence, JSON claim values, or an UNKNOWN placeholder. `docs/prompts/agent0-foundation.md` is authoritative.
- Do not add infrastructure (graph DB, search cluster, vector DB, auth, billing) unless the spec names it.

## Loop
`pnpm i` → change → `pnpm check` → fix until green → `pnpm fixtures` if contracts or seed data changed → commit → `git pull --rebase` → push. If `pnpm check` cannot run (no pnpm, no database), fix the environment with `tooling/dev-setup.sh`; do not ask, do not skip.

## Environment
Postgres at `DATABASE_URL` (see `.env.example`). `docker compose up -d db` or a local Postgres 16 both work.
