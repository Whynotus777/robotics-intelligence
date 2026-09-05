import Link from "next/link";
import { EntityChipLink } from "@/components/entity-chip";
import { EvidenceChip } from "@/components/evidence/evidence-chip";
import { data, orNotFound } from "@/lib/data";
import { eventTypeLabel, formatDate, formatValue, showsTransition } from "@/lib/vocabulary";

/**
 * The "What's changing" strip. When no change events are recorded the strip is
 * omitted entirely — absence is absence, and nothing here says "0".
 */
export async function WhatsChanging({ limit = 5 }: { limit?: number }) {
  const provider = await data();
  const payload = await orNotFound(provider.updates());
  const events = payload?.events.slice(0, limit) ?? [];
  if (events.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 border-t border-line-soft pt-6">
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="eyebrow">What is changing</div>
          <h2 className="mt-1 text-[15px]/[1.3] font-semibold">Recent changes</h2>
        </div>
        <Link href="/updates" className="text-[12px] text-accent hover:underline">
          All updates →
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-line-soft">
        {events.map((event) => {
          const type = eventTypeLabel(event.event_type);
          return (
          <div
            key={event.id}
            className="flex flex-col gap-1.5 py-2.5 text-[12px] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1.5 sm:py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="num shrink-0 text-[11px] text-ink-4 sm:w-[84px]">{formatDate(event.observed_at)}</span>
              <span className="min-w-0">
                <EntityChipLink chip={event.entity} />
              </span>
            </div>
            {type ? (
              <span className="num shrink-0 text-[10px] tracking-[0.06em] text-ink-4">{type}</span>
            ) : null}
            <span className="min-w-0 flex-1 break-words text-ink-2">{event.summary}</span>
            {showsTransition(event) ? (
              <span className="num min-w-0 break-words text-[11px] text-ink-3">
                {event.before ? formatValue(event.before) : null} →{" "}
                <span className="text-ink">{event.after ? formatValue(event.after) : "removed"}</span>
              </span>
            ) : null}
            {event.evidence_summary ? (
              <span className="shrink-0">
                <EvidenceChip summary={event.evidence_summary} />
              </span>
            ) : null}
          </div>
          );
        })}
      </div>
    </section>
  );
}
