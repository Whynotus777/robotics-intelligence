import type { UpdatesResponse } from "@ri/api-contracts";
import { CHANGE_EVENT_TYPES, EMBODIMENTS } from "@ri/domain";
import { EntityChipLink } from "@/components/entity-chip";
import { EvidenceChip } from "@/components/evidence/evidence-chip";
import { FilterGroup } from "@/components/filter-bar";
import { PathBar } from "@/components/path-bar";
import { data, orNotFound } from "@/lib/data";
import { CHANGE_EVENT_LABEL, EMBODIMENT_LABEL, formatDate, formatValue } from "@/lib/vocabulary";

export const metadata = { title: "Updates" };

type Search = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function one(value: string | string[] | undefined): string | null {
  const first = Array.isArray(value) ? value[0] : value;
  return first && first.length > 0 ? first : null;
}

/**
 * Updates: the change feed, grouped by the day the change was observed. Evidence
 * chips are visible here by default — this is one of the four places the
 * visibility rule allows them. Filters are links, so a filtered feed is shareable.
 */
export default async function UpdatesPage({ searchParams }: Search) {
  const params = await searchParams;
  const type = one(params.type);
  const embodiment = one(params.embodiment);
  const market = one(params.market);

  const provider = await data();
  const query: Record<string, string> = { limit: "200" };
  if (type) query.type = type;
  if (embodiment) query.embodiment = embodiment;
  if (market) query.market = market;

  const payload = await orNotFound(provider.updates(query));
  const all = payload?.events ?? [];

  // The market lens tells us which entities belong to a market; a provider that
  // already filtered by market simply agrees with the membership set.
  const explore = await orNotFound(provider.explore("market"));
  const inMarket = market && explore
    ? new Set(
        explore.regions
          .filter((region) => region.id === market)
          .flatMap((region) => region.districts.flatMap((district) => district.entities.map(({ chip }) => chip.id))),
      )
    : null;

  const events = all.filter(
    (event) =>
      (!type || event.event_type === type) &&
      (!embodiment || event.entity.primary_embodiment === embodiment) &&
      (!inMarket || inMarket.has(event.entity.id)),
  );

  const filters = { type: type ?? undefined, embodiment: embodiment ?? undefined, market: market ?? undefined };
  const types = CHANGE_EVENT_TYPES.filter((value) => all.some((event) => event.event_type === value));
  const embodiments = EMBODIMENTS.filter((value) => all.some((event) => event.entity.primary_embodiment === value));
  const markets = explore?.regions ?? [];

  const days = groupByDay(events);

  return (
    <div className="flex max-w-[1180px] flex-col gap-5">
      <PathBar label="Updates" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">What is changing</span>
          <h1 className="text-[24px]/[1.1] font-semibold tracking-[-0.02em]">Updates</h1>
        </div>
        {events.length > 0 ? (
          <span className="num text-[11px] text-ink-4">
            {events.length} change{events.length === 1 ? "" : "s"}
            {events.length !== all.length ? ` of ${all.length}` : ""}
          </span>
        ) : null}
      </div>

      <p className="max-w-[640px] text-[13px]/[1.6] text-ink-3">
        Every change the record itself generated — a new claim, a changed spec, a maturity call, a new partnership —
        with what it changed from, what it changed to, and the evidence behind it.
      </p>

      {all.length > 0 ? (
        <div className="flex flex-col gap-2.5 border-y border-line-soft py-3.5">
          {types.length > 1 ? (
            <FilterGroup
              name="Type"
              current={type}
              basePath="/updates"
              params={filters}
              options={[
                { label: "All", value: null },
                ...types.map((value) => ({ label: CHANGE_EVENT_LABEL[value] ?? value, value })),
              ]}
            />
          ) : null}
          {embodiments.length > 0 ? (
            <FilterGroup
              name="Embodiment"
              current={embodiment}
              basePath="/updates"
              params={filters}
              options={[
                { label: "All", value: null },
                ...embodiments.map((value) => ({ label: EMBODIMENT_LABEL[value], value })),
              ]}
            />
          ) : null}
          {markets.length > 0 ? (
            <FilterGroup
              name="Market"
              current={market}
              basePath="/updates"
              params={filters}
              options={[
                { label: "All", value: null },
                ...markets.map((region) => ({ label: region.label, value: region.id })),
              ]}
            />
          ) : null}
        </div>
      ) : null}

      {days.length > 0 ? (
        <div className="flex flex-col gap-6">
          {days.map((day) => (
            <section key={day.date} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="num text-[11px] text-ink-3">{formatDate(day.date)}</span>
                <span className="h-px flex-1 bg-line-soft" />
                <span className="num text-[10px] text-ink-5">{day.events.length}</span>
              </div>
              <div className="flex flex-col divide-y divide-line-soft">
                {day.events.map((event) => (
                  <div key={event.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 text-[12px]">
                    <EntityChipLink chip={event.entity} />
                    <span className="num text-[10px] tracking-[0.06em] text-ink-4">
                      {CHANGE_EVENT_LABEL[event.event_type] ?? event.event_type}
                    </span>
                    <span className="min-w-0 flex-1 text-ink-2">{event.summary}</span>
                    {event.before || event.after ? (
                      <span className="num flex items-center gap-1.5 text-[11px]">
                        {event.before ? <span className="text-ink-4 line-through">{formatValue(event.before)}</span> : null}
                        <span className="text-ink-5">→</span>
                        <span className="text-ink">{event.after ? formatValue(event.after) : "removed"}</span>
                      </span>
                    ) : null}
                    {event.evidence_summary ? <EvidenceChip summary={event.evidence_summary} /> : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="max-w-[560px] text-[13px]/[1.6] text-ink-3">
          {all.length === 0
            ? "No change events are recorded yet. The feed stays empty rather than inventing a first entry."
            : "No change matches these filters. Widen one of them — the record is thinner than the question."}
        </p>
      )}
    </div>
  );
}

function groupByDay(events: UpdatesResponse["events"]) {
  const days = new Map<string, UpdatesResponse["events"]>();
  for (const event of events) {
    const date = event.observed_at.slice(0, 10);
    (days.get(date) ?? (days.set(date, []), days.get(date)!)).push(event);
  }
  return [...days.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, rows]) => ({ date, events: rows }));
}
