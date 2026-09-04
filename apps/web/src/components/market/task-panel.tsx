import type { TaskResponse, TextItem } from "@ri/api-contracts";
import { EntityChipLink, PillLink } from "@/components/entity-chip";
import { EvidenceChip, OpenEvidence, SourceGlyph } from "@/components/evidence/evidence-chip";
import { MaturitySteps } from "@/components/maturity";
import { Section } from "@/components/section";
import { MATURITY_LABEL, formatDate } from "@/lib/vocabulary";

/**
 * The task panel, in the order the screen answers its questions: what the
 * incumbent does, why we rate the task this way, how robots attack it, what it
 * demands, who sells and buys it, what blocks it, and where to go next.
 * Sections without data are absent; that absence is a finding, not a gap.
 */
export function TaskPanel({ task }: { task: TaskResponse }) {
  const { maturity } = task;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-3.5">
            <h1 className="text-[22px]/[1.1] font-semibold tracking-[-0.02em]">{task.task.name}</h1>
            {maturity ? (
              <span className="flex flex-wrap items-center gap-2">
                <MaturitySteps maturity={maturity.value} />
                <span className="text-[13px] font-medium">{MATURITY_LABEL[maturity.value]}</span>
                <EvidenceChip summary={maturity.evidence_summary} claimId={maturity.claim_id} />
              </span>
            ) : null}
          </div>
          {task.short_description ? (
            <p className="max-w-[640px] text-[13px]/[1.65] text-ink-2">{task.short_description}</p>
          ) : null}
        </header>

        {maturity?.assessment ? (
          <section className="flex flex-col gap-1.5 border-l-2 border-analyst/50 pl-3.5">
            <span className="eyebrow text-analyst">Why we rate it this way</span>
            <p className="max-w-[640px] text-[13px]/[1.65] text-ink-2">{maturity.assessment.rationale}</p>
            <OpenEvidence claimId={maturity.claim_id}>What would move it →</OpenEvidence>
          </section>
        ) : null}

        {task.incumbent_process?.length ? (
          <Section question="What happens today" title="The incumbent process">
            <TextItems items={task.incumbent_process} />
          </Section>
        ) : null}

        {task.approaches?.length ? (
          <Section question="How do robots attack it" title="Robotics approaches">
            <div className="flex flex-col gap-2">
              {task.approaches.map((approach) => (
                <div
                  key={approach.approach.id}
                  className="flex flex-col gap-2 rounded-panel border border-line-soft bg-panel-deep p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <EntityChipLink chip={approach.approach} />
                    {approach.maturity ? (
                      <span className="flex items-center gap-2">
                        <MaturitySteps maturity={approach.maturity.value} width={11} />
                        <span className="text-[12px] font-medium">{MATURITY_LABEL[approach.maturity.value]}</span>
                        <EvidenceChip
                          summary={approach.maturity.evidence_summary}
                          claimId={approach.maturity.claim_id}
                        />
                      </span>
                    ) : null}
                  </div>
                  {approach.short_description ? (
                    <p className="text-[12px]/[1.6] text-ink-3">{approach.short_description}</p>
                  ) : null}
                  {approach.example_vendors.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-ink-4">example vendors</span>
                      {approach.example_vendors.map((vendor) => (
                        <PillLink key={vendor.id} chip={vendor} />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {task.technical_requirements?.length ? (
          <Section question="What does it demand" title="Technical requirements">
            <div className="flex flex-wrap gap-2">
              {task.technical_requirements.map((item) => (
                <span
                  key={item.claim_id}
                  className="inline-flex items-center gap-1.5 rounded-chip border border-line bg-raised px-2 py-[5px] text-[12px] text-ink-2"
                >
                  {item.text}
                  <SourceGlyph summary={item.evidence_summary} claimId={item.claim_id} />
                </span>
              ))}
            </div>
          </Section>
        ) : null}

        {task.required_technologies?.length ? (
          <Section question="What does it run on" title="Related technologies">
            <div className="flex flex-wrap gap-2">
              {task.required_technologies.map((technology) => (
                <EntityChipLink key={technology.id} chip={technology} />
              ))}
            </div>
          </Section>
        ) : null}

        {task.vendors?.length || task.deployments?.length || task.robots?.length ? (
          <Section question="Who is doing it" title="Vendors and deployments">
            <div className="flex flex-col gap-3">
              {task.vendors?.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-[110px] shrink-0 text-[12px] text-ink-4">vendors</span>
                  {task.vendors.map((vendor) => (
                    <EntityChipLink key={vendor.organization.id} chip={vendor.organization} />
                  ))}
                </div>
              ) : null}
              {task.robots?.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-[110px] shrink-0 text-[12px] text-ink-4">robots</span>
                  {task.robots.map((robot) => (
                    <EntityChipLink key={robot.id} chip={robot} />
                  ))}
                </div>
              ) : null}
              {task.deployments?.map((deployment) => (
                <div key={deployment.deployment.id} className="flex flex-wrap items-center gap-2">
                  <span className="w-[110px] shrink-0 text-[12px] text-ink-4">
                    {deployment.began ? formatDate(deployment.began) : "deployment"}
                  </span>
                  <EntityChipLink chip={deployment.deployment} />
                  {deployment.customer ? <EntityChipLink chip={deployment.customer} /> : null}
                  <SourceGlyph summary={deployment.evidence_summary} />
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {task.customer_types?.length ? (
          <Section question="Who buys it" title="Target customers">
            <TextItems items={task.customer_types} />
          </Section>
        ) : null}

        {task.blockers?.length ? (
          <Section question="What is in the way" title="Adoption barriers">
            <TextItems items={task.blockers} />
          </Section>
        ) : null}

        {task.economics_notes?.length ? (
          <Section question="Does it pay" title="Economics">
            <TextItems items={task.economics_notes} />
          </Section>
        ) : null}
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-5 lg:self-start">
        {task.adjacent_tasks?.length ? (
          <div className="flex flex-col gap-2.5 rounded-panel border border-line-soft bg-panel-deep p-4">
            <span className="eyebrow">Adjacent tasks</span>
            <div className="flex flex-wrap gap-2">
              {task.adjacent_tasks.map((adjacent) => (
                <PillLink key={adjacent.id} chip={adjacent} />
              ))}
            </div>
          </div>
        ) : null}
        {task.market_path.length > 0 ? (
          <div className="flex flex-col gap-2.5 rounded-panel border border-line-soft bg-panel-deep p-4">
            <span className="eyebrow">Explore from here</span>
            <div className="flex flex-wrap gap-2">
              {task.market_path.map((market) => (
                <PillLink key={market.id} chip={market} />
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

/** Text claims render as a list with the analyst argument inline where it exists. */
function TextItems({ items }: { items: TextItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.claim_id} className="flex flex-col gap-1.5">
          <p className="flex max-w-[640px] flex-wrap items-baseline gap-1.5 text-[13px]/[1.65] text-ink-2">
            {item.text}
            {item.assessment ? (
              <EvidenceChip summary={item.evidence_summary} claimId={item.claim_id} />
            ) : (
              <SourceGlyph summary={item.evidence_summary} claimId={item.claim_id} />
            )}
          </p>
          {item.assessment ? (
            <p className="max-w-[640px] border-l-2 border-analyst/50 pl-3.5 text-[12px]/[1.6] text-ink-3">
              {item.assessment.rationale}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
