import Link from "next/link";
import type { EntityChip, EntityResponse } from "@ri/api-contracts";
import type { CommercialStage } from "@ri/domain";
import { CommercialStageBadge } from "@/components/commercial-stage";
import { EntityChipLink, PillLink } from "@/components/entity-chip";
import { SourceGlyph } from "@/components/evidence/evidence-chip";
import { TypeGlyph } from "@/components/glyph";
import { PathBar } from "@/components/path-bar";
import { Section } from "@/components/section";
import { IntelligenceRail } from "@/components/profile/intelligence-rail";
import type { CompanyView, DeploymentRow, Sourced } from "@/lib/company";
import {
  EMBODIMENT_LABEL,
  EMBODIMENT_ORDER,
  embodimentColor,
  formatDate,
  sentenceCase,
} from "@/lib/vocabulary";

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  notation: "compact",
});

/**
 * The company state of the profile template: who they are and where, what they
 * make, who buys it, and where it is running. Same skeleton, same section
 * grammar and the same How-we-know rail as the robot state — a company with two
 * facts to its name renders as four short sections, never as an empty shell.
 */
export function CompanyProfile({ entity, view }: { entity: EntityResponse; view: CompanyView }) {
  const identity = entity.entity;
  const prose = entity.claims.flatMap((group) =>
    group.claims.filter((claim) => claim.value.kind === "text").map((claim) => claim),
  );
  const related = relatedGroups(entity, view.consumed);
  const peers = entity.lateral_links.peers ?? [];
  const lateral = lateralChips(entity);
  const orderedProducts = [...view.products].sort(
    (a, b) => groupRank(a.embodiment) - groupRank(b.embodiment) || a.label.localeCompare(b.label),
  );

  return (
    <div className="flex max-w-[1180px] flex-col gap-6">
      <PathBar
        label={identity.name}
        checked={entity.intelligence.last_verified_at ? formatDate(entity.intelligence.last_verified_at) : null}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-x-8">
        {/* Identity: who, where, since when, and who owns them. */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-chip border border-line bg-raised px-2 py-[5px] text-[12px] leading-none font-medium">
              <TypeGlyph chip={identity} />
              Company
            </span>
            {identity.country_code ? (
              <span className="num text-[12px] text-ink-3">{identity.country_code}</span>
            ) : null}
          </div>

          <h1 className="text-[28px]/[1.05] font-semibold tracking-[-0.02em] sm:text-[36px]">{identity.name}</h1>

          {identity.short_description ? (
            <p className="max-w-[620px] text-[14px]/[1.6] text-ink-2">{identity.short_description}</p>
          ) : null}

          <IdentityFacts view={view} />

          {prose.length > 0 ? (
            <div className="flex max-w-[640px] flex-col gap-3 pt-1">
              {prose.map((claim) =>
                claim.value.kind === "text" ? (
                  <p key={claim.claim_id} className="text-[13px]/[1.65] text-ink-2">
                    {claim.value.text} <SourceGlyph summary={claim.evidence_summary} claimId={claim.claim_id} />
                  </p>
                ) : null,
              )}
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

        <IntelligenceRail entity={entity} />

        <div className="flex flex-col gap-9 lg:col-start-1 lg:row-start-2">
          {orderedProducts.length > 0 ? (
            <Section question="What does it make" title="Products">
              <div className="flex flex-col gap-5">
                {orderedProducts.map((group) => (
                  <div key={group.key} className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      {group.embodiment ? (
                        <i
                          className="inline-block size-2 rounded-[2px]"
                          style={{ background: embodimentColor(group.embodiment) }}
                        />
                      ) : null}
                      <span className="eyebrow">
                        {group.embodiment ? EMBODIMENT_LABEL[group.embodiment] : group.label}
                      </span>
                      <span className="num text-[10px] text-ink-5">{group.products.length}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.products.map((product) => (
                        <div
                          key={product.claimId}
                          className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-panel border border-line-soft bg-panel-deep px-3 py-2.5"
                        >
                          <EntityChipLink chip={product.chip} />
                          {product.commercialStage ? (
                            <CommercialStageBadge stage={product.commercialStage as CommercialStage} bare />
                          ) : null}
                          <span className="ml-auto flex items-center gap-1.5">
                            <span className="text-[11px] text-ink-4">{product.role}</span>
                            <SourceGlyph summary={product.summary} claimId={product.claimId} align="right" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {view.customers.length > 0 || view.partners.length > 0 || view.vendors.length > 0 ? (
            <Section question="Who buys it" title="Customers and partners">
              <div className="flex flex-col gap-3">
                <ChipRow label="Customers" rows={view.customers} />
                <ChipRow label="Partners" rows={view.partners} />
                <ChipRow label="Vendors" rows={view.vendors} />
              </div>
            </Section>
          ) : null}

          {view.deployments.length > 0 ? (
            <Section question="Where is it running" title="Deployments">
              <div className="flex flex-col divide-y divide-line-soft">
                {view.deployments.map((row) => (
                  <DeploymentLine key={row.claimId} row={row} />
                ))}
              </div>
            </Section>
          ) : null}

          {view.markets.length > 0 ? (
            <Section question="Where is it used" title="Markets and tasks">
              <div className="flex flex-wrap gap-2">
                {view.markets.map((row) => (
                  <span key={row.claimId} className="inline-flex items-center gap-1">
                    <EntityChipLink chip={row.value} />
                    <SourceGlyph summary={row.summary} claimId={row.claimId} />
                  </span>
                ))}
              </div>
            </Section>
          ) : null}

          {peers.length > 0 ? (
            <Section
              question="How does it compare"
              title="Comparisons"
              action={
                <Link
                  href={`/compare?slugs=${[identity.slug, ...peers.slice(0, 3).map((peer) => peer.slug)].join(",")}`}
                  className="text-[12px] text-accent hover:underline"
                >
                  Compare with {peers.slice(0, 3).map((peer) => peer.name).join(" · ")} →
                </Link>
              }
            >
              <div className="flex flex-wrap gap-2">
                {peers.map((chip) => (
                  <EntityChipLink key={chip.id} chip={chip} />
                ))}
              </div>
            </Section>
          ) : null}

          {related.length > 0 ? (
            <Section question="What is it connected to" title="Related">
              <div className="flex flex-col gap-3">
                {related.map((group) => (
                  <div key={group.label} className="flex flex-wrap items-center gap-2">
                    <span className="w-[130px] shrink-0 text-[12px] text-ink-4">{sentenceCase(group.label)}</span>
                    {group.rows.map((row) => (
                      <span key={row.claimId} className="inline-flex items-center gap-1">
                        <EntityChipLink chip={row.value} />
                        <SourceGlyph summary={row.summary} claimId={row.claimId} />
                      </span>
                    ))}
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

/** HQ, founded, ownership and sites — each line omitted when the fact is absent. */
function IdentityFacts({ view }: { view: CompanyView }) {
  const lines: { label: string; body: React.ReactNode }[] = [];

  if (view.hq.length > 0)
    lines.push({
      label: "HQ",
      body: (
        <span className="flex flex-wrap items-center gap-1.5">
          {view.hq.map((row) => (
            <span key={row.claimId} className="inline-flex items-center gap-1">
              <Link href={`/e/${row.value.slug}`} className="text-ink hover:text-accent">
                {row.value.name}
              </Link>
              <SourceGlyph summary={row.summary} claimId={row.claimId} />
            </span>
          ))}
        </span>
      ),
    });

  if (view.founded)
    lines.push({
      label: "Founded",
      body: (
        <span className="num inline-flex items-center gap-1.5 text-ink">
          {new Date(view.founded.value).getUTCFullYear()}
          <SourceGlyph summary={view.founded.summary} claimId={view.founded.claimId} />
        </span>
      ),
    });

  if (view.owners.length > 0)
    lines.push({
      label: "Ownership",
      body: (
        <span className="flex flex-wrap items-center gap-1.5 text-ink-3">
          part of
          {view.owners.map((row) => (
            <span key={row.claimId} className="inline-flex items-center gap-1">
              <EntityChipLink chip={row.value} />
              <SourceGlyph summary={row.summary} claimId={row.claimId} />
            </span>
          ))}
        </span>
      ),
    });
  else if (view.holdings.length > 0)
    lines.push({
      label: "Ownership",
      body: (
        <span className="flex flex-wrap items-center gap-1.5 text-ink-3">
          owns
          {view.holdings.map((row) => (
            <span key={row.claimId} className="inline-flex items-center gap-1">
              <EntityChipLink chip={row.value} />
              <SourceGlyph summary={row.summary} claimId={row.claimId} />
            </span>
          ))}
        </span>
      ),
    });

  if (view.funding.length > 0) {
    const total = view.funding.reduce((sum, row) => sum + row.value.amount, 0);
    lines.push({
      label: "Funding",
      body: (
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="num text-ink">{USD.format(total)}</span>
          <span className="text-ink-4">
            across {view.funding.length} round{view.funding.length === 1 ? "" : "s"}
          </span>
          <SourceGlyph summary={view.funding[0]!.summary} claimId={view.funding[0]!.claimId} />
        </span>
      ),
    });
  }

  for (const site of view.sites)
    lines.push({
      label: site.label,
      body: (
        <span className="flex flex-wrap items-center gap-1.5">
          {site.places.map((row) => (
            <span key={row.claimId} className="inline-flex items-center gap-1">
              <Link href={`/e/${row.value.slug}`} className="text-ink hover:text-accent">
                {row.value.name}
              </Link>
              <SourceGlyph summary={row.summary} claimId={row.claimId} />
            </span>
          ))}
        </span>
      ),
    });

  if (lines.length === 0) return null;

  return (
    <dl className="grid max-w-[620px] grid-cols-[92px_minmax(0,1fr)] gap-x-3 gap-y-2 border-t border-line-soft pt-3.5 text-[12px]">
      {lines.map((line) => (
        <div key={line.label} className="contents">
          <dt className="text-ink-4">{line.label}</dt>
          <dd className="min-w-0">{line.body}</dd>
        </div>
      ))}
    </dl>
  );
}

function DeploymentLine({ row }: { row: DeploymentRow }) {
  const counterpart = row.role === "operator" ? row.customer : (row.operators[0] ?? null);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 text-[12px]">
      <EntityChipLink chip={row.chip} />
      {counterpart ? (
        <span className="flex items-center gap-1.5 text-ink-4">
          {row.role === "operator" ? "for" : "with"}
          <EntityChipLink chip={counterpart} />
        </span>
      ) : null}
      {row.robots.map((robot) => (
        <EntityChipLink key={robot.id} chip={robot} />
      ))}
      {row.places.map((place) => (
        <span key={place.id} className="text-ink-3">
          {place.name}
        </span>
      ))}
      {row.scale ? <span className="num text-[11px] text-ink-2">{row.scale}</span> : null}
      {row.kind ? <span className="num text-[10px] tracking-[0.06em] text-ink-4">{row.kind}</span> : null}
      <span className="ml-auto flex items-center gap-2">
        {row.began ? <span className="num text-[11px] text-ink-4">{formatDate(row.began)}</span> : null}
        <SourceGlyph summary={row.summary} claimId={row.claimId} align="right" />
      </span>
    </div>
  );
}

function ChipRow({ label, rows }: { label: string; rows: Sourced<EntityChip>[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-[80px] shrink-0 text-[12px] text-ink-4">{label}</span>
      {rows.map((row) => (
        <span key={`${row.claimId}-${row.value.id}`} className="inline-flex items-center gap-1">
          <EntityChipLink chip={row.value} />
          <SourceGlyph summary={row.summary} claimId={row.claimId} />
        </span>
      ))}
    </div>
  );
}

/** Everything the company sections did not already answer, still reachable. */
function relatedGroups(entity: EntityResponse, consumed: ReadonlySet<string>) {
  const groups: { label: string; rows: Sourced<EntityChip>[] }[] = [];
  const push = (label: string, rows: Sourced<EntityChip>[]) => {
    if (rows.length === 0) return;
    const existing = groups.find((group) => group.label === label);
    if (existing) existing.rows.push(...rows);
    else groups.push({ label, rows });
  };

  for (const group of entity.relationships) {
    if (consumed.has(group.predicate)) continue;
    push(
      group.label,
      group.items.map((item) => ({ value: item.target, claimId: item.claim_id, summary: item.evidence_summary })),
    );
  }
  for (const group of entity.inbound_relationships) {
    if (consumed.has(group.predicate)) continue;
    push(
      `${group.label} (inbound)`,
      group.items.map((item) => ({ value: item.source, claimId: item.claim_id, summary: item.evidence_summary })),
    );
  }
  return groups;
}

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

function groupRank(embodiment: string | null): number {
  if (!embodiment) return EMBODIMENT_ORDER.length;
  const index = EMBODIMENT_ORDER.indexOf(embodiment as (typeof EMBODIMENT_ORDER)[number]);
  return index === -1 ? EMBODIMENT_ORDER.length : index;
}
