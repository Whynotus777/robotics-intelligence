import type { CommercialStage } from "@ri/domain";
import { COMMERCIAL_STAGES } from "@ri/domain";
import { COMMERCIAL_STAGE_LABEL, commercialStageStep } from "@/lib/vocabulary";

/**
 * Commercial stage answers "can I buy and deploy this today?" — a fact about a
 * robot. Five neutral dots, never the amber maturity treatment.
 */
export function CommercialStageBadge({ stage, bare = false }: { stage: CommercialStage; bare?: boolean }) {
  const filled = commercialStageStep(stage);
  const dots = (
    <span className="inline-flex gap-[3px]">
      {COMMERCIAL_STAGES.map((_, index) => (
        <i
          key={index}
          className={`inline-block size-1.5 rounded-full ${index < filled ? "bg-ink-2" : "bg-line-strong"}`}
        />
      ))}
    </span>
  );
  if (bare)
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px]">
        {dots}
        {COMMERCIAL_STAGE_LABEL[stage]}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-chip border border-line-strong px-2.5 py-[5px] text-[12px] font-medium">
      {dots}
      {COMMERCIAL_STAGE_LABEL[stage]}
    </span>
  );
}
