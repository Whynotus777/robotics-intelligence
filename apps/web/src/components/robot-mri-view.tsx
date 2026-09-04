"use client";

import { useRouter } from "next/navigation";
import type { EntityChip, StackResponse } from "@ri/api-contracts";
import { RobotMRI } from "@ri/viz";
import { hrefFor } from "@/lib/vocabulary";

/**
 * The Robot MRI itself is a pure component; this wrapper gives it the one thing it
 * does not own — navigation out of a layer to the entity behind it. Layer focus and
 * the cross-embodiment toggle are the component's own state.
 */
export function RobotMRIView({
  stack,
  comparisonStacks,
}: {
  stack: StackResponse;
  comparisonStacks: StackResponse[];
}) {
  const router = useRouter();
  const open = (chip: EntityChip) => router.push(hrefFor(chip));
  return <RobotMRI stack={stack} comparisonStacks={comparisonStacks} onOpenEntity={open} />;
}
