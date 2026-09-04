import "server-only";
import type { EntityChip, EntityResponse, EvidenceSummary } from "@ri/api-contracts";
import type { Embodiment } from "@ri/domain";
import { data, orNotFound } from "@/lib/data";

/**
 * The company state of the profile template needs one hop past the entity
 * payload: a deployment says who the customer is, and a product says how far
 * along it is. Both are read through the same DataProvider, and anything that
 * fails to load is simply left out — a sparse company still renders.
 */

export type Sourced<T> = { value: T; claimId: string; summary: EvidenceSummary };

export type ProductRow = {
  chip: EntityChip;
  claimId: string;
  summary: EvidenceSummary;
  role: string;
  commercialStage: string | null;
};

export type ProductGroup = { key: string; label: string; embodiment: Embodiment | null; products: ProductRow[] };

export type DeploymentRow = {
  chip: EntityChip;
  claimId: string;
  summary: EvidenceSummary;
  /** Whether this company operates the deployment or is the customer on it. */
  role: "operator" | "customer";
  customer: EntityChip | null;
  operators: EntityChip[];
  robots: EntityChip[];
  places: EntityChip[];
  began: string | null;
  scale: string | null;
  kind: string | null;
};

export type CompanyView = {
  founded: Sourced<string> | null;
  funding: Sourced<{ amount: number; on: string }>[];
  owners: Sourced<EntityChip>[];
  holdings: Sourced<EntityChip>[];
  sites: { label: string; places: Sourced<EntityChip>[] }[];
  hq: Sourced<EntityChip>[];
  products: ProductGroup[];
  partners: Sourced<EntityChip>[];
  customers: Sourced<EntityChip>[];
  vendors: Sourced<EntityChip>[];
  markets: Sourced<EntityChip>[];
  deployments: DeploymentRow[];
  /** Predicates already answered above, so the generic Related section skips them. */
  consumed: ReadonlySet<string>;
};

const PRODUCT_PREDICATES = ["BUILDS", "DEVELOPS", "PROVIDES", "PUBLISHES"] as const;
const SITE_PREDICATES: { predicate: string; label: string }[] = [
  { predicate: "RND_AT", label: "R&D" },
  { predicate: "MANUFACTURES_AT", label: "Manufacturing" },
];

const CONSUMED = new Set<string>([
  "HQ_AT",
  "RND_AT",
  "MANUFACTURES_AT",
  "PARTNERS_WITH",
  "ACQUIRED",
  "TARGETS_MARKET",
  "TARGETS_TASK",
  "OPERATED_BY",
  "DEPLOYED_BY",
  "MADE_BY",
  ...PRODUCT_PREDICATES,
]);

function outbound(entity: EntityResponse, predicate: string) {
  const group = entity.relationships.find((row) => row.predicate === predicate);
  return (group?.items ?? []).map((item) => ({
    value: item.target,
    claimId: item.claim_id,
    summary: item.evidence_summary,
  }));
}

function inbound(entity: EntityResponse, predicate: string) {
  const group = entity.inbound_relationships.find((row) => row.predicate === predicate);
  return (group?.items ?? []).map((item) => ({
    value: item.source,
    claimId: item.claim_id,
    summary: item.evidence_summary,
  }));
}

function dedupe<T extends Sourced<EntityChip>>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => (seen.has(row.value.id) ? false : (seen.add(row.value.id), true)));
}

const PRODUCT_ROLE: Record<string, string> = {
  BUILDS: "builds",
  DEVELOPS: "develops",
  PROVIDES: "provides",
  PUBLISHES: "publishes",
  MADE_BY: "makes",
};

const NON_EMBODIED_GROUP: Record<string, string> = {
  MODEL: "Models",
  SOFTWARE_PRODUCT: "Software",
  COMPONENT_PRODUCT: "Components",
  ROBOT_FAMILY: "Robot families",
  TECHNOLOGY: "Technologies",
  PAPER: "Publications",
};

/** Reads the company's own payload plus the one hop its sections need. */
export async function companyView(entity: EntityResponse): Promise<CompanyView> {
  const provider = await data();

  const productClaims = [
    ...PRODUCT_PREDICATES.flatMap((predicate) =>
      outbound(entity, predicate).map((row) => ({ ...row, predicate })),
    ),
    ...inbound(entity, "MADE_BY").map((row) => ({ ...row, predicate: "MADE_BY" })),
  ];
  const uniqueProducts = dedupe(productClaims);

  const productEntities = await Promise.all(
    uniqueProducts.map((row) => orNotFound(provider.entity(row.value.slug))),
  );

  const groups = new Map<string, ProductGroup>();
  for (const [index, row] of uniqueProducts.entries()) {
    const embodiment = row.value.primary_embodiment;
    const key = embodiment ?? `type:${row.value.entity_type}`;
    const group =
      groups.get(key) ??
      (groups.set(key, {
        key,
        label: embodiment
          ? ""
          : (NON_EMBODIED_GROUP[row.value.entity_type] ??
            row.value.entity_type.replaceAll("_", " ").toLowerCase()),
        embodiment: embodiment ?? null,
        products: [],
      }),
      groups.get(key)!);
    group.products.push({
      chip: row.value,
      claimId: row.claimId,
      summary: row.summary,
      role: PRODUCT_ROLE[row.predicate] ?? "makes",
      commercialStage: productEntities[index]?.cached.commercial_stage ?? null,
    });
  }

  const deploymentClaims = [
    ...inbound(entity, "OPERATED_BY").map((row) => ({ ...row, role: "operator" as const })),
    ...inbound(entity, "DEPLOYED_BY").map((row) => ({ ...row, role: "customer" as const })),
  ];
  const deploymentEntities = await Promise.all(
    deploymentClaims.map((row) => orNotFound(provider.entity(row.value.slug))),
  );

  const deployments: DeploymentRow[] = deploymentClaims.map((row, index) => {
    const payload = deploymentEntities[index];
    const claim = (predicate: string) =>
      payload?.claims.find((group) => group.predicate === predicate)?.claims[0] ?? null;
    const began = claim("BEGAN");
    const scale = claim("HAS_SCALE");
    const kind = claim("HAS_DEPLOYMENT_KIND");
    return {
      chip: row.value,
      claimId: row.claimId,
      summary: row.summary,
      role: row.role,
      customer: payload ? (outbound(payload, "DEPLOYED_BY")[0]?.value ?? null) : null,
      operators: payload ? outbound(payload, "OPERATED_BY").map((item) => item.value) : [],
      robots: payload ? outbound(payload, "USES_ROBOT").map((item) => item.value) : [],
      places: payload ? outbound(payload, "OCCURS_AT").map((item) => item.value) : [],
      began: began?.value.kind === "date" ? began.value.date : null,
      scale:
        scale?.value.kind === "number"
          ? `${scale.value.is_approximate ? "~" : ""}${scale.value.number} ${scale.value.unit}`
          : null,
      kind: kind?.value.kind === "enum" ? kind.value.value.replaceAll("_", " ").toLowerCase() : null,
    };
  });

  // A vendor's customers are the customers of the deployments it operates; a
  // customer's vendors are the operators of the deployments it buys.
  const customers = dedupe(
    deployments
      .filter((row) => row.role === "operator" && row.customer)
      .map((row) => ({ value: row.customer!, claimId: row.claimId, summary: row.summary })),
  ).filter((row) => row.value.id !== entity.entity.id);
  const vendors = dedupe(
    deployments
      .filter((row) => row.role === "customer")
      .flatMap((row) => row.operators.map((operator) => ({ value: operator, claimId: row.claimId, summary: row.summary }))),
  ).filter((row) => row.value.id !== entity.entity.id);

  const fundingClaims = entity.claims.find((group) => group.predicate === "FUNDED")?.claims ?? [];
  const foundedClaim = entity.claims.find((group) => group.predicate === "FOUNDED_ON")?.claims[0];

  return {
    founded:
      foundedClaim && foundedClaim.value.kind === "date"
        ? { value: foundedClaim.value.date, claimId: foundedClaim.claim_id, summary: foundedClaim.evidence_summary }
        : null,
    funding: fundingClaims.flatMap((claim) =>
      claim.value.kind === "number"
        ? [
            {
              value: { amount: claim.value.number, on: claim.valid_from },
              claimId: claim.claim_id,
              summary: claim.evidence_summary,
            },
          ]
        : [],
    ),
    owners: inbound(entity, "ACQUIRED"),
    holdings: outbound(entity, "ACQUIRED"),
    hq: outbound(entity, "HQ_AT"),
    sites: SITE_PREDICATES.flatMap((site) => {
      const places = outbound(entity, site.predicate);
      return places.length > 0 ? [{ label: site.label, places }] : [];
    }),
    products: [...groups.values()],
    partners: dedupe([...outbound(entity, "PARTNERS_WITH"), ...inbound(entity, "PARTNERS_WITH")]),
    customers,
    vendors,
    markets: dedupe([...outbound(entity, "TARGETS_MARKET"), ...outbound(entity, "TARGETS_TASK")]),
    deployments,
    consumed: CONSUMED,
  };
}
