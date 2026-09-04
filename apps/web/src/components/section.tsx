import type { ReactNode } from "react";

/**
 * The section grammar of every profile and explorer: an eyebrow that names the
 * question the section answers, then the section title. A section is never
 * rendered empty — callers omit it entirely instead.
 */
export function Section({
  question,
  title,
  action,
  children,
}: {
  question: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="eyebrow">{question}</div>
          <h2 className="mt-1 text-[15px]/[1.3] font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SubHead({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}
