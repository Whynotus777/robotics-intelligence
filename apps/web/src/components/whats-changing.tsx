import Link from "next/link";
import { EntityChipLink } from "@/components/entity-chip";
import { EvidenceChip } from "@/components/evidence/evidence-chip";
import { data, orNotFound } from "@/lib/data";
import { CHANGE_EVENT_LABEL, formatDate, formatValue } from "@/lib/vocabulary";

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
        {events.map((event) => (
          <div key={event.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2 text-[12px]">
            <span className="num w-[84px] shrink-0 text-[11px] text-ink-4">{formatDate(event.observed_at)}</span>
            <EntityChipLink chip={event.entity} />
            <span className="num text-[10px] tracking-[0.06em] text-ink-4">
              {CHANGE_EVENT_LABEL[event.event_type] ?? event.event_type}
            </span>
            <span className="min-w-0 flex-1 text-ink-2">{event.summary}</span>
            {event.before && event.after ? (
              <span className="num text-[11px] text-ink-3">
                {formatValue(event.before)} → <span className="text-ink">{formatValue(event.after)}</span>
              </span>
            ) : null}
            {event.evidence_summary ? <EvidenceChip summary={event.evidence_summary} /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
