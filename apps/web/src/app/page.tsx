import Link from "next/link";
import type { EntityResponse, ExploreLens, ExploreResponse, StackResponse } from "@ri/api-contracts";
import type { ExploreEntityMeta } from "@ri/viz";
import type { Embodiment } from "@ri/domain";
import { COMMERCIAL_STAGES, EMBODIMENTS } from "@ri/domain";
import { EXPLORE_LENSES } from "@ri/api-contracts";
import { PathBar } from "@/components/path-bar";
import { SearchLauncher } from "@/components/command-palette";
import { FilterGroup } from "@/components/filter-bar";
import { CommercialStageBadge } from "@/components/commercial-stage";
import { TypeGlyph } from "@/components/glyph";
import { SourceGlyph } from "@/components/evidence/evidence-chip";
import { WhatsChanging } from "@/components/whats-changing";
import { ExploreCanvas } from "@/components/explore/explore-canvas";
import { data, orNotFound } from "@/lib/data";
import {
  COMMERCIAL_STAGE_LABEL,
  EMBODIMENT_GROUP,
  EMBODIMENT_LABEL,
  EMBODIMENT_ORDER,
  embodimentColor,
  formatDate,
  hrefFor,
} from "@/lib/vocabulary";

type Query = { embodiment?: string; commercial_stage?: string; country_code?: string };

const isEmbodiment = (value: string | undefined): value is Embodiment =>
  !!value && (EMBODIMENTS as readonly string[]).includes(value);

/**
 * Explore. The Universe is the nested-territories map from @ri/viz, with the
 * stack-first matrix as its challenger behind a toggle. Below 1024px both fall
 * back to the same filterable list, driven by the same filters.
 */
export default async function ExplorePage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const provider = await data();

  const filters = {
    ...(isEmbodiment(query.embodiment) ? { embodiment: query.embodiment } : {}),
    ...(query.commercial_stage && (COMMERCIAL_STAGES as readonly string[]).includes(query.commercial_stage)
      ? { commercial_stage: query.commercial_stage as (typeof COMMERCIAL_STAGES)[number] }
      : {}),
    ...(query.country_code?.length === 2 ? { country_code: query.country_code.toUpperCase() } : {}),
  };

  const { robots } = await provider.robots(filters);
  const entities = (await Promise.all(robots.map((robot) => orNotFound(provider.entity(robot.slug))))).filter(
    (entity): entity is EntityResponse => entity !== null,
  );

  // The five lenses and every robot stack: the territories map switches lenses
  // itself, and the matrix reads stack membership, so both arrive resolved.
  const lensResponses = Object.fromEntries(
    (
      await Promise.all(
        EXPLORE_LENSES.map(async (lens) => [lens, await orNotFound(provider.explore(lens, "none"))] as const),
      )
    ).filter((entry): entry is readonly [ExploreLens, ExploreResponse] => entry[1] !== null),
  ) as Partial<Record<ExploreLens, ExploreResponse>>;

  const allRobots = (await provider.robots()).robots;
  const stacks = (await Promise.all(allRobots.map((robot) => orNotFound(provider.stack(robot.slug))))).filter(
    (stack): stack is StackResponse => stack !== null,
  );

  const allEntities = (await Promise.all(allRobots.map((robot) => orNotFound(provider.entity(robot.slug))))).filter(
    (entity): entity is EntityResponse => entity !== null,
  );
  const entityMeta: Record<string, ExploreEntityMeta> = Object.fromEntries(
    allEntities.map((entity) => [
      entity.entity.slug,
      {
        description: entity.entity.short_description,
        stage_or_maturity: entity.cached.commercial_stage ? COMMERCIAL_STAGE_LABEL[entity.cached.commercial_stage] : null,
        evidence_summary:
          entity.claims.find((group) => group.predicate === "HAS_COMMERCIAL_STAGE")?.claims[0]?.evidence_summary ?? null,
      },
    ]),
  );

  const countries = [...new Set(entities.map((entity) => entity.entity.country_code).filter(Boolean))].sort();
  const lastChecked = entities
    .map((entity) => entity.intelligence.last_verified_at)
    .filter((value): value is string => !!value)
    .sort()
    .at(-1);

  const groups = EMBODIMENT_ORDER.reduce<{ label: string; entities: EntityResponse[] }[]>((accumulator, embodiment) => {
    const label = EMBODIMENT_GROUP[embodiment];
    const members = entities.filter((entity) => entity.entity.primary_embodiment === embodiment);
    if (members.length === 0) return accumulator;
    const existing = accumulator.find((group) => group.label === label);
    if (existing) existing.entities.push(...members);
    else accumulator.push({ label, entities: members });
    return accumulator;
  }, []);

  const params: Record<string, string | undefined> = {
    embodiment: query.embodiment,
    commercial_stage: query.commercial_stage,
    country_code: query.country_code,
  };

  return (
    <div className="flex max-w-[1180px] flex-col gap-5">
      <PathBar label="Explore" lens="lens · Embodiment" checked={lastChecked ? formatDate(lastChecked) : null} />

      <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
        <h1 className="max-w-[560px] text-[24px]/[1.15] font-semibold tracking-[-0.02em]">
          How robotics fits together — the machines, the stacks inside them, and the markets buying them.
        </h1>
        <SearchLauncher />
      </div>

      <div className="flex flex-col gap-2.5 border-y border-line-soft py-3">
        <FilterGroup
          name="Embodiment"
          current={query.embodiment ?? null}
          basePath="/"
          params={params}
          options={[
            { label: "All", value: null },
            ...EMBODIMENT_ORDER.filter((embodiment) =>
              robotsHaveEmbodiment(entities, embodiment) || query.embodiment === embodiment,
            ).map((embodiment) => ({ label: EMBODIMENT_LABEL[embodiment], value: embodiment })),
          ]}
        />
        <FilterGroup
          name="Commercial stage"
          current={query.commercial_stage ?? null}
          basePath="/"
          params={params}
          options={[
            { label: "All", value: null },
            ...COMMERCIAL_STAGES.map((stage) => ({ label: COMMERCIAL_STAGE_LABEL[stage], value: stage })),
          ]}
        />
        {countries.length > 1 ? (
          <FilterGroup
            name="Country code"
            current={query.country_code ?? null}
            basePath="/"
            params={params}
            options={[{ label: "All", value: null }, ...countries.map((code) => ({ label: code!, value: code! }))]}
          />
        ) : null}
      </div>

      <ExploreCanvas responses={lensResponses} stacks={stacks} entityMeta={entityMeta} />

      {groups.length === 0 ? (
        <p className="py-10 text-[13px] text-ink-3 lg:hidden">Nothing matches those filters.</p>
      ) : (
        <div className="flex flex-col gap-7 lg:hidden">
          {groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-2.5">
              <header className="flex items-center gap-2.5">
                <i
                  className="inline-block size-2.5 rounded-[2px]"
                  style={{ background: embodimentColor(group.entities[0]?.entity.primary_embodiment) }}
                />
                <h2 className="num text-[10px] font-semibold tracking-[0.08em] text-ink-2 uppercase">{group.label}</h2>
                <span className="num text-[10px] text-ink-4">{group.entities.length}</span>
              </header>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {group.entities.map((entity) => (
                  <RobotCard key={entity.entity.id} entity={entity} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <WhatsChanging />

      <section className="grid gap-3 border-t border-line-soft pt-6 sm:grid-cols-3">
        <EntryTile
          eyebrow="Where is it used"
          title="Markets"
          example="Energy → Wind → Blade repair"
          href="/m/wind"
        />
        <EntryTile
          eyebrow="How does it work"
          title="Robot MRI"
          example="Unitree G1 · eleven canonical layers"
          href="/r/unitree-g1/stack"
        />
        <EntryTile
          eyebrow="How does it compare"
          title="Compare"
          example="Figure 03 · Unitree G1 · Apollo"
          href="/compare"
        />
      </section>
    </div>
  );
}

function robotsHaveEmbodiment(entities: EntityResponse[], embodiment: Embodiment) {
  return entities.some((entity) => entity.entity.primary_embodiment === embodiment);
}

function RobotCard({ entity }: { entity: EntityResponse }) {
  const stageClaim = entity.claims.find((group) => group.predicate === "HAS_COMMERCIAL_STAGE")?.claims[0];
  return (
    <Link
      href={hrefFor(entity.entity)}
      className="flex flex-col gap-2 rounded-panel border border-line-soft bg-panel-deep p-3 transition-colors hover:border-line-strong"
    >
      <div className="flex items-center gap-2">
        <TypeGlyph chip={entity.entity} />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{entity.entity.name}</span>
        {entity.entity.country_code ? (
          <span className="num shrink-0 text-[10px] text-ink-4">{entity.entity.country_code}</span>
        ) : null}
      </div>
      {entity.entity.short_description ? (
        <p className="line-clamp-2 text-[12px]/[1.5] text-ink-3">{entity.entity.short_description}</p>
      ) : null}
      {entity.cached.commercial_stage ? (
        <span className="flex items-center gap-1.5 text-ink-2">
          <CommercialStageBadge stage={entity.cached.commercial_stage} bare />
          <SourceGlyph summary={stageClaim?.evidence_summary} claimId={stageClaim?.claim_id} />
        </span>
      ) : null}
    </Link>
  );
}

function EntryTile({
  eyebrow,
  title,
  example,
  href,
}: {
  eyebrow: string;
  title: string;
  example: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1.5 rounded-panel border border-line-soft bg-panel-deep p-4 transition-colors hover:border-line-strong"
    >
      <span className="eyebrow">{eyebrow}</span>
      <span className="text-[15px]/[1.3] font-semibold">{title}</span>
      <span className="text-[12px] text-ink-3">{example}</span>
    </Link>
  );
}
