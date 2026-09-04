import type { EntityChip as Chip } from "@ri/api-contracts";
import { embodimentColor, glyphFor, type ChipGlyph } from "@/lib/vocabulary";

const HEX = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

/** Glyph by entity type, colour by embodiment — the one categorical encoding. */
export function TypeGlyph({ chip, size = 8 }: { chip: Pick<Chip, "entity_type" | "primary_embodiment">; size?: number }) {
  const kind: ChipGlyph = glyphFor(chip.entity_type);
  const color = embodimentColor(chip.primary_embodiment);
  const base = { width: size, height: size, display: "inline-block", flex: "none" } as const;

  if (kind === "ring")
    return <i style={{ ...base, borderRadius: "50%", border: `1.5px solid ${color}`, boxSizing: "border-box" }} />;
  if (kind === "dot") return <i style={{ ...base, borderRadius: "50%", background: color }} />;
  if (kind === "diamond")
    return <i style={{ ...base, width: size - 1, height: size - 1, background: color, transform: "rotate(45deg)" }} />;
  if (kind === "hex") return <i style={{ ...base, background: color, clipPath: HEX }} />;
  return <i style={{ ...base, borderRadius: 2, background: color }} />;
}
