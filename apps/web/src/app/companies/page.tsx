import { Directory } from "@/components/directory";

export const metadata = { title: "Companies" };

export default function CompaniesPage() {
  return (
    <Directory
      title="Companies"
      question="Who builds it"
      entityType="ORGANIZATION"
      intro="Every organization with a profile — makers, integrators and the customers running them. Open one for its products, customers and deployments."
    />
  );
}
