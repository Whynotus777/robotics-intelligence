#!/usr/bin/env bash
set -euo pipefail
if ! command -v pnpm >/dev/null; then
  if command -v corepack >/dev/null; then corepack enable && corepack prepare pnpm@10 --activate; else npm install -g pnpm@10; fi
fi
[ -f .env ] || cp .env.example .env
if ! (command -v pg_isready >/dev/null && pg_isready -q -h localhost -p 5432); then
  if command -v docker >/dev/null; then docker compose up -d db && sleep 3
  else echo "No Postgres on :5432 and no docker. Install postgresql-16 (role ri/ri, db robotics_intelligence) or Docker." >&2; exit 1; fi
fi
pnpm i
echo "ready: pnpm db:migrate && pnpm seed && pnpm fixtures && pnpm check"
