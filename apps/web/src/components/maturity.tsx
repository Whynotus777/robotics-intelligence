import type { Maturity } from "@ri/domain";
import { MATURITIES } from "@ri/domain";
import { MATURITY_LABEL, maturityStep } from "@/lib/vocabulary";

/**
 * Task / market maturity: five ordinal steps, never a bar or a percentage, always
 * amber so the scale itself reads as judgment, and always accompanied by the
 * ANALYST marker at the call site.
 */
export function MaturitySteps({ maturity, width = 14 }: { maturity: Maturity; width?: number }) {
  const filled = maturityStep(maturity);
  return (
    <span className="inline-flex gap-[2px]" role="img" aria-label={`Maturity: ${MATURITY_LABEL[maturity]}`}>
      {MATURITIES.map((_, index) => (
        <i
          key={index}
          style={{ width, height: 8 }}
          className={`inline-block rounded-[1px] ${index < filled ? "bg-analyst" : "bg-analyst-dim"}`}
        />
      ))}
    </span>
  );
}
