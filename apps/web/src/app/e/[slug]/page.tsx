import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CompanyProfile } from "@/components/profile/company-profile";
import { EntityProfile } from "@/components/profile/entity-profile";
import { companyView } from "@/lib/company";
import { data, orNotFound } from "@/lib/data";
import { hrefFor } from "@/lib/vocabulary";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const entity = await orNotFound((await data()).entity(slug));
  return entity ? { title: entity.entity.name, description: entity.entity.short_description ?? undefined } : {};
}

/**
 * The same profile template for every entity type that does not have a screen of
 * its own — company, technology, product, place, deployment. No dead ends.
 * ORGANIZATION enters the company state of the template; everything else enters
 * the generic one.
 */
export default async function EntityProfilePage({ params }: Params) {
  const { slug } = await params;
  const entity = await orNotFound((await data()).entity(slug));
  if (!entity) notFound();

  const canonical = hrefFor(entity.entity);
  if (canonical !== `/e/${slug}`) redirect(canonical);

  if (entity.entity.entity_type === "ORGANIZATION")
    return <CompanyProfile entity={entity} view={await companyView(entity)} />;

  return <EntityProfile entity={entity} />;
}
