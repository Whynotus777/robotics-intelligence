# apps/web — Agent 1

The Next.js 15 product shell (App Router, TypeScript, Tailwind v4). It composes
screens; it does not fetch, model or store anything of its own.

## Data

Every screen reads through `DataProvider` from `@ri/fixtures`, resolved once in
`src/lib/data.ts`:

- default — `FixtureProvider` over `packages/fixtures/generated/index.json`, so
  the app runs with no database;
- `DATA_PROVIDER=http` — `HttpProvider` against `API_BASE_URL`.

Screens never learn which is in use. The generated JSON is imported lazily so
the http mode does not pull it into the bundle. A fixture that is not there is a
404, never an error page (`orNotFound`).

Two API routes exist only so client components can reach the same provider:
`/api/search` backs the ⌘K palette and `/api/claims/[id]/evidence` backs the
Evidence Drawer.

## Design

`src/app/globals.css` carries the tokens from `docs/design/phase1-canvas.html`
as CSS variables through Tailwind's `@theme`: ground/panel/raised greys, one
accent for interactive state, amber reserved for analyst judgment, and
embodiment as the only categorical hue. Geist and Geist Mono come from
`next/font` via the `geist` package. The vocabulary of the design prompt
(embodiment groups and colours, maturity, commercial stage, evidence classes,
layer labels, glyphs, value formatting) lives in `src/lib/vocabulary.ts`.

Rules the components enforce:

- a section is omitted entirely when empty — nothing renders "unknown" or "0";
- evidence chips are visible by default only in the intelligence rail, the
  drawer and Updates; everywhere else a 5px source glyph carries it and the chip
  appears on hover;
- the ANALYST marker is always inline, and maturity is always amber and always
  five discrete steps;
- commercial stage is five neutral dots and never shares maturity's treatment.

## Routes

| Route | Screen |
|---|---|
| `/` | Explore — searchable, filterable list grouped by embodiment, the "What's changing" strip, three entry tiles. The nested-territories treemap replaces the list when `@ri/viz` ships it. |
| `/r/[slug]` | Robot profile (5.2) |
| `/r/[slug]/stack` | Robot MRI (5.3), layer focus on click |
| `/m/[slug]` | Market explorer — sector rail, maturity board |
| `/t/[slug]` | Task explorer (5.4) — board plus the task panel with the analyst rationale inline |
| `/e/[slug]` | The same profile template for companies, technologies, products, places and deployments |
| `/robots`, `/markets`, `/technology` | directories |
| `/companies`, `/compare`, `/atlas`, `/updates` | placeholders, nav present |

The Evidence Drawer opens over any of them from any evidence chip or source
glyph, and the ⌘K palette and path bar are global.

Not yet rendered because the contract does not carry it: the profile's Sources
section wants source rows, and `GET /entities/:slug` returns only counts by
class — the intelligence rail shows those and each value opens the drawer.
`GET /updates` currently returns no events, so the "What's changing" strip and
the Updates feed render nothing rather than inventing a first entry.

## Layout

Desktop-first: a 200px nav rail at 1024+, a 320px intelligence rail on profiles.
Below 1024 the nav becomes a horizontal scroller and the rails stack below the
content. Nothing overflows at 390px; wide tables scroll inside their own
container.

## Build

`pnpm --filter web build`. The workspace packages ship ESM TypeScript with
explicit `.js` specifiers, so `next.config.ts` sets `transpilePackages`, a
webpack `extensionAlias`, and `outputFileTracingRoot` at the repo root for the
Vercel build (project root directory `apps/web`, see `docs/deploy.md`).
