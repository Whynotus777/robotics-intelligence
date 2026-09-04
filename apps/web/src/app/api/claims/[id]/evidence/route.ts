import { NextResponse } from "next/server";
import { data } from "@/lib/data";

/** The Evidence Drawer payload, straight off the claim-evidence route. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const provider = await data();
  try {
    return NextResponse.json(await provider.claimEvidence(id));
  } catch {
    return NextResponse.json({ error: "no evidence recorded" }, { status: 404 });
  }
}
