import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PathBar } from "@/components/path-bar";
import { SectorRail } from "@/components/market/sector-rail";
import { MaturityBoard } from "@/components/market/maturity-board";
import { TaskPanel } from "@/components/market/task-panel";
import { data, orNotFound } from "@/lib/data";
import { formatDate } from "@/lib/vocabulary";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const task = await orNotFound((await data()).task(slug));
  return task ? { title: task.task.name, description: task.short_description ?? undefined } : {};
}

/** The task state of the Market and Use-Case explorer, with the board above it. */
export default async function TaskPage({ params }: Params) {
  const { slug } = await params;
  const provider = await data();
  const task = await orNotFound(provider.task(slug));
  if (!task) notFound();

  const domain = task.market_path.at(-1);
  const market = domain ? await orNotFound(provider.market(domain.slug)) : null;

  return (
    <div className="flex max-w-[1240px] flex-col gap-5 lg:flex-row lg:gap-8">
      <SectorRail activeSlugs={task.market_path.map((step) => step.slug)} />

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <PathBar
          label={task.task.name}
          checked={task.maturity ? formatDate(task.maturity.assessment?.reviewed_at ?? new Date().toISOString()) : null}
        />

        {market && market.board.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[24px]/[1.1] font-semibold tracking-[-0.02em]">{market.market.name}</h2>
              <span className="text-[11px] text-ink-4">
                Task maturity · five steps · every value is an analyst assessment
              </span>
            </div>
            <MaturityBoard board={market.board} activeSlug={task.task.slug} />
          </div>
        ) : null}

        <TaskPanel task={task} />
      </div>
    </div>
  );
}
