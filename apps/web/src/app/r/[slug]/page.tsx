import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EntityProfile } from "@/components/profile/entity-profile";
import { data, orNotFound } from "@/lib/data";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entity = await orNotFound((await data()).entity(slug));
  return entity ? { title: entity.entity.name, description: entity.entity.short_description ?? undefined } : {};
}

/** The robot profile: what is it, how mature is it, and how do we know. */
export default async function RobotProfilePage({ params }: Params) {
  const { slug } = await params;
  const provider = await data();
  const entity = await orNotFound(provider.entity(slug));
  if (!entity) notFound();

  const stack = entity.entity.entity_type === "ROBOT" ? await orNotFound(provider.stack(slug)) : null;
  return <EntityProfile entity={entity} stack={stack} />;
}
