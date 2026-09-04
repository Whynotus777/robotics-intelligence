import Link from "next/link";
import { PathBar } from "@/components/path-bar";

/**
 * A screen that is in the navigation but not yet built. It says what will live
 * here and offers the doors that already work — never an empty shell.
 */
export function Placeholder({
  title,
  question,
  body,
  doors,
}: {
  title: string;
  question: string;
  body: string;
  doors: { label: string; href: string }[];
}) {
  return (
    <div className="flex max-w-[720px] flex-col gap-5">
      <PathBar label={title} />
      <div className="flex flex-col gap-2">
        <span className="eyebrow">{question}</span>
        <h1 className="text-[24px]/[1.1] font-semibold tracking-[-0.02em]">{title}</h1>
      </div>
      <p className="text-[13px]/[1.65] text-ink-3">{body}</p>
      <div className="flex flex-wrap gap-2 border-t border-line-soft pt-5">
        <span className="eyebrow self-center">Explore from here</span>
        {doors.map((door) => (
          <Link
            key={door.href}
            href={door.href}
            className="rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-3 transition-colors hover:border-line-strong hover:text-ink"
          >
            {door.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
