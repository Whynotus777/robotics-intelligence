import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex max-w-[560px] flex-col gap-4 py-16">
      <span className="eyebrow">Nothing here</span>
      <h1 className="text-[24px]/[1.1] font-semibold tracking-[-0.02em]">We have no record of that.</h1>
      <p className="text-[13px]/[1.65] text-ink-3">
        The product states only what is known, so a page with nothing behind it does not exist rather than rendering
        empty.
      </p>
      <Link href="/" className="w-fit text-[12px] text-accent hover:underline">
        Back to Explore →
      </Link>
    </div>
  );
}
