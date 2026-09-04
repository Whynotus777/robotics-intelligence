import type { StackResponse } from "@ri/api-contracts";

/**
 * The compact MRI thumbnail on a profile. Applicable-but-empty layers still draw
 * — the stack itself is the explanatory object — but they never say "unknown".
 */
export function StackThumbnail({ stack }: { stack: StackResponse }) {
  return (
    <div className="flex w-full flex-col gap-0.5 text-[11px] lg:w-[220px]">
      {stack.layers.map((layer) => {
        const filled = layer.items.length > 0;
        const summary =
          layer.items.length === 1 ? layer.items[0]!.entity.name : layer.items.length > 1 ? String(layer.items.length) : "";
        return (
          <div
            key={layer.canonical}
            className={`flex items-center justify-between gap-2 rounded-[3px] border px-2 py-[5px] ${
              filled ? "border-line-strong bg-panel text-ink" : "border-line-soft text-ink-4"
            }`}
          >
            <span className="truncate">{layer.label}</span>
            {summary ? <span className="shrink-0 truncate text-ink-3">{summary}</span> : null}
          </div>
        );
      })}
      {stack.safety.length > 0 ? (
        <div className="mt-1 flex items-center justify-between gap-2 rounded-[3px] border border-line-strong bg-panel px-2 py-[5px]">
          <span className="truncate">Safety</span>
          <span className="shrink-0 text-ink-3">{stack.safety.length}</span>
        </div>
      ) : null}
    </div>
  );
}
