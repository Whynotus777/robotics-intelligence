import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { PathBar } from "@/components/path-bar";
import { StackExplorer } from "@/components/stack-explorer";
import { data, orNotFound } from "@/lib/data";
import { EMBODIMENT_LABEL, formatDate } from "@/lib/vocabulary";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const stack = await orNotFound((await data()).stack(slug));
  return stack ? { title: `${stack.robot.name} · Stack` } : {};
}

/** The Robot MRI: how this robot works, layer by layer. */
export default async function StackPage({ params }: Params) {
  const { slug } = await params;
  const provider = await data();
  const stack = await orNotFound(provider.stack(slug));
  if (!stack) notFound();
  const entity = await orNotFound(provider.entity(slug));

  return (
    <div className="flex max-w-[1180px] flex-col gap-5">
      <PathBar
        label={`${stack.robot.name} · Stack`}
        lens={`embodiment · ${EMBODIMENT_LABEL[stack.embodiment]}`}
        checked={entity?.intelligence.last_verified_at ? formatDate(entity.intelligence.last_verified_at) : null}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3.5">
          <h1 className="text-[24px]/[1.1] font-semibold tracking-[-0.02em]">{stack.robot.name}</h1>
          <Link href={`/r/${stack.robot.slug}`} className="text-[12px] text-accent hover:underline">
            ← profile
          </Link>
        </div>
        <span className="text-[11px] text-ink-4">
          Eleven canonical layers with {EMBODIMENT_LABEL[stack.embodiment].toLowerCase()} labels · layers that do not
          apply are omitted
        </span>
      </div>
      <StackExplorer stack={stack} />
    </div>
  );
}
