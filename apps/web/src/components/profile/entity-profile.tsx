import Link from "next/link";
import type { EntityChip, EntityResponse, StackResponse } from "@ri/api-contracts";
import { EntityChipLink, PillLink } from "@/components/entity-chip";
import { TypeGlyph } from "@/components/glyph";
import { CommercialStageBadge } from "@/components/commercial-stage";
import { SourceGlyph } from "@/components/evidence/evidence-chip";
import { PathBar } from "@/components/path-bar";
import { Section } from "@/components/section";
import { IntelligenceRail } from "@/components/profile/intelligence-rail";
import { SpecGrid, collectSpecs } from "@/components/profile/spec-grid";
import { StackThumbnail } from "@/components/profile/stack-thumbnail";
import {
  EMBODIMENT_LABEL,
  IDENTITY_PREDICATES,
  STACK_MEMBERSHIP_PREDICATES,
  embodimentColor,
  formatDate,
  sectionFor,
  sentenceCase,
  type ProfileSection,
} from "@/lib/vocabulary";

type Group = { predicate: string; label: string; chips: { chip: EntityChip; claimId: string; summary: EntityResponse["claims"][number]["claims"][number]["evidence_summary"] }[] };

/**
 * One profile template. Robot is the primary instance; a company, technology,
 * product or place enters the same skeleton with the sections its data supports.
 * Every section is omitted entirely when empty — sparse must look designed.
 */
export function EntityProfile({ entity, stack }: { entity: EntityResponse; stack?: StackResponse | null }) {
  const identity = entity.entity;
  const company = entity.lateral_links.company?.[0];
  const priceClaim = entity.claims.find((group) => group.predicate === "HAS_LIST_PRICE")?.claims[0];
  const stageClaim = entity.claims.find((group) => group.predicate === "HAS_COMMERCIAL_STAGE")?.claims[0];

  const prose = entity.claims.flatMap((group) =>
    group.claims.filter((claim) => claim.value.kind === "text").map((claim) => ({ claim, label: group.label })),
  );
  const specs = collectSpecs(entity, IDENTITY_PREDICATES);

  const grouped = groupRelationships(entity, stack ? STACK_MEMBERSHIP_PREDICATES : new Set<string>());
  const dated = entity.claims
    .flatMap((group) => group.claims.map((claim) => ({ claim, label: group.label })))
    .filter((row) => row.claim.value.kind === "date")
    .sort((a, b) => b.claim.valid_from.localeCompare(a.claim.valid_from));

  const lateral = lateralChips(entity);
  const peers = entity.lateral_links.peers ?? [];

  return (
    <div className="flex max-w-[1180px] flex-col gap-6">
      <PathBar
        label={identity.name}
        checked={entity.intelligence.last_verified_at ? formatDate(entity.intelligence.last_verified_at) : null}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-x-8">
        {/* Identity block */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div
            className="hidden h-[200px] w-[168px] shrink-0 items-center justify-center rounded-panel border border-line-soft p-3 text-center md:flex"
            style={{
              background: "repeating-linear-gradient(135deg,#13151a 0 8px,#101216 8px 16px)",
            }}
          >
            <span className="num text-[10px] text-ink-4">{identity.name}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {identity.primary_embodiment ? (
                <span className="inline-flex items-center gap-1.5 rounded-chip border border-line bg-raised px-2 py-[5px] text-[12px] leading-none font-medium">
                  <i
                    className="inline-block size-2 rounded-[2px]"
                    style={{ background: embodimentColor(identity.primary_embodiment) }}
                  />
                  {EMBODIMENT_LABEL[identity.primary_embodiment]}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-chip border border-line bg-raised px-2 py-[5px] text-[12px] leading-none font-medium">
                  <TypeGlyph chip={identity} />
                  {identity.entity_type.replaceAll("_", " ").toLowerCase()}
                </span>
              )}
              {company ? <EntityChipLink chip={company} showType /> : null}
              {entity.place?.city ? (
                <span className="text-[12px] text-ink-3">
                  {entity.place.city}
                  {entity.place.admin_region ? `, ${entity.place.admin_region}` : ""}
                </span>
              ) : identity.country_code ? (
                <span className="num text-[12px] text-ink-3">{identity.country_code}</span>
              ) : null}
            </div>

            <h1 className="text-[28px]/[1.05] font-semibold tracking-[-0.02em] sm:text-[36px]">{identity.name}</h1>

            {identity.short_description ? (
              <p className="max-w-[620px] text-[14px]/[1.6] text-ink-2">{identity.short_description}</p>
            ) : null}

            {entity.cached.commercial_stage || priceClaim ? (
              <div className="flex flex-wrap items-center gap-3.5">
                {entity.cached.commercial_stage ? (
                  <span className="flex items-center gap-1.5">
                    <CommercialStageBadge stage={entity.cached.commercial_stage} />
                    <SourceGlyph summary={stageClaim?.evidence_summary} claimId={stageClaim?.claim_id} />
                  </span>
                ) : null}
                {priceClaim ? (
                  <span className="flex items-center gap-1.5 text-[12px] text-ink-3">
                    List price
                    <span className="num text-[13px] font-medium text-ink">
                      {priceClaim.value.kind === "number"
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            maximumFractionDigits: 0,
                          }).format(priceClaim.value.number)
                        : null}
                    </span>
                    <span className="text-ink-4">since {formatDate(priceClaim.valid_from)}</span>
                    <SourceGlyph summary={priceClaim.evidence_summary} claimId={priceClaim.claim_id} />
                  </span>
                ) : null}
              </div>
            ) : null}

            {lateral.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="eyebrow">Explore from here</span>
                {lateral.map((chip) => (
                  <PillLink key={`${chip.entity_type}-${chip.id}`} chip={chip} />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <IntelligenceRail entity={entity} />

        {/* Sections. The rail sits above these on mobile and beside them at 1024+. */}
        <div className="flex flex-col gap-9 lg:col-start-1 lg:row-start-2">
          {prose.length > 0 ? (
            <Section question="What is it" title="Overview">
              <div className="flex max-w-[640px] flex-col gap-3">
                {prose.map(({ claim }) =>
                  claim.value.kind === "text" ? (
                    <p key={claim.claim_id} className="text-[13px]/[1.65] text-ink-2">
                      {claim.value.text}{" "}
                      <SourceGlyph summary={claim.evidence_summary} claimId={claim.claim_id} />
                    </p>
                  ) : null,
                )}
              </div>
            </Section>
          ) : null}

          {stack ? (
            <Section
              question="How does it work"
              title="Stack"
              action={
                <Link href={`/r/${entity.entity.slug}/stack`} className="text-[12px] text-accent hover:underline">
                  Open Robot MRI →
                </Link>
              }
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                <StackThumbnail stack={stack} />
                <div className="flex min-w-0 flex-1 flex-col gap-4">
                  {specs.length > 0 ? (
                    <>
                      <div className="eyebrow">Specs · by layer</div>
                      <SpecGrid specs={specs} />
                    </>
                  ) : null}
                </div>
              </div>
            </Section>
          ) : specs.length > 0 ? (
            <Section question="What is known" title="Specs">
              <SpecGrid specs={specs} />
            </Section>
          ) : null}

          <RelationshipSection
            groups={grouped.markets}
            question="Where is it used"
            title="Use cases and markets"
          />
          <RelationshipSection
            groups={grouped.makers}
            question="Who builds it"
            title={entity.entity.entity_type === "ORGANIZATION" ? "Products" : "Makers and suppliers"}
          />
          <RelationshipSection
            groups={grouped.deployments}
            question="Who buys it"
            title="Deployments and customers"
          />

          {grouped.compare.length > 0 || peers.length > 0 ? (
            <Section
              question="How does it compare"
              title="Comparisons"
              action={
                peers.length > 0 ? (
                  <Link
                    href={`/compare?slugs=${[identity.slug, ...peers.slice(0, 3).map((peer) => peer.slug)].join(",")}`}
                    className="text-[12px] text-accent hover:underline"
                  >
                    Compare with {peers.slice(0, 3).map((peer) => peer.name).join(" · ")} →
                  </Link>
                ) : undefined
              }
            >
              <div className="flex flex-wrap gap-2">
                {(grouped.compare.flatMap((group) => group.chips.map((entry) => entry.chip)).length > 0
                  ? grouped.compare.flatMap((group) => group.chips.map((entry) => entry.chip))
                  : peers
                ).map((chip) => (
                  <EntityChipLink key={chip.id} chip={chip} />
                ))}
              </div>
            </Section>
          ) : null}

          <RelationshipSection groups={grouped.related} question="What is it connected to" title="Related" />

          {dated.length > 0 ? (
            <Section question="What is changing" title="Timeline">
              <div className="flex flex-col gap-2">
                {dated.map(({ claim, label }) => (
                  <div key={claim.claim_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                    <span className="num w-[90px] shrink-0 text-[11px] text-ink-4">
                      {claim.value.kind === "date" ? formatDate(claim.value.date) : null}
                    </span>
                    <span className="min-w-0 flex-1 text-ink-2">{sentenceCase(label)}</span>
                    <SourceGlyph summary={claim.evidence_summary} claimId={claim.claim_id} align="right" />
                  </div>
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RelationshipSection({
  groups,
  question,
  title,
}: {
  groups: Group[];
  question: string;
  title: string;
}) {
  if (groups.length === 0) return null;
  return (
    <Section question={question} title={title}>
      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <div key={`${group.predicate}-${group.label}`} className="flex flex-wrap items-center gap-2">
            <span className="w-[130px] shrink-0 text-[12px] text-ink-4">{sentenceCase(group.label)}</span>
            {group.chips.map((entry) => (
              <span key={entry.claimId} className="inline-flex items-center gap-1">
                <EntityChipLink chip={entry.chip} />
                <SourceGlyph summary={entry.summary} claimId={entry.claimId} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}

function groupRelationships(
  entity: EntityResponse,
  skipOutbound: ReadonlySet<string>,
): Record<ProfileSection, Group[]> {
  const buckets: Record<ProfileSection, Group[]> = {
    markets: [],
    deployments: [],
    makers: [],
    compare: [],
    related: [],
  };

  for (const group of entity.relationships) {
    if (skipOutbound.has(group.predicate)) continue;
    push(buckets[sectionFor(group.predicate)], {
      predicate: group.predicate,
      label: group.label,
      chips: group.items.map((item) => ({
        chip: item.target,
        claimId: item.claim_id,
        summary: item.evidence_summary,
      })),
    });
  }

  for (const group of entity.inbound_relationships) {
    // The company that builds this robot is already the identity block's chip.
    if (group.predicate === "BUILDS") continue;
    push(buckets[sectionFor(group.predicate)], {
      predicate: group.predicate,
      label: inboundLabel(group.predicate, group.label),
      chips: group.items.map((item) => ({
        chip: item.source,
        claimId: item.claim_id,
        summary: item.evidence_summary,
      })),
    });
  }

  return buckets;
}

/** Two predicates can share a plain-words label ("uses"); they read as one row. */
function push(bucket: Group[], group: Group) {
  const existing = bucket.find((row) => row.label === group.label);
  if (existing) existing.chips.push(...group.chips);
  else bucket.push(group);
}

const INBOUND_LABEL: Record<string, string> = {
  USES_ROBOT: "deployed in",
  USES_TECHNOLOGY: "used by",
  USES_PRODUCT: "used by",
  MEMBER_OF_FAMILY: "members",
  IS_INSTANCE_OF: "instances",
  TARGETS_TASK: "targeted by",
  TARGETS_MARKET: "targeted by",
  HQ_AT: "headquartered here",
  MANUFACTURES_AT: "manufactures here",
  OCCURS_AT: "happens here",
  OPERATED_BY: "operates",
  DEPLOYED_BY: "deployed by",
  MADE_BY: "makes",
  PROVIDES: "provided by",
  DEVELOPS: "developed by",
  SERVES_TASK: "serves",
  BELONGS_TO_MARKET: "tasks",
  CHILD_OF: "children",
  HAS_APPROACH: "approach to",
  HAS_EXAMPLE_VENDOR: "example vendor for",
  COMPETES_WITH: "compared with",
  SUCCEEDS: "succeeded by",
  CONTROLLED_BY: "controls",
  PARTNERS_WITH: "partners with",
  PUBLISHES: "published by",
};

function inboundLabel(predicate: string, fallback: string): string {
  return INBOUND_LABEL[predicate] ?? `${fallback} (inbound)`;
}

/** Lateral exits: the doors this entity opens, deduplicated across link kinds. */
function lateralChips(entity: EntityResponse): EntityChip[] {
  const seen = new Set<string>();
  return Object.values(entity.lateral_links)
    .flat()
    .filter((chip): chip is EntityChip => {
      if (!chip || seen.has(chip.id)) return false;
      seen.add(chip.id);
      return true;
    });
}
