import { Placeholder } from "@/components/placeholder";

export const metadata = { title: "Companies" };

export default function CompaniesPage() {
  return (
    <Placeholder
      title="Companies"
      question="Who builds it"
      body="The company state of the profile template — HQ, ownership, products grouped by embodiment, customers and partners — lands here next. Company profiles already render on the shared template, so every company chip in the product opens one today."
      doors={[
        { label: "Unitree Robotics", href: "/e/unitree" },
        { label: "Figure AI", href: "/e/figure-ai" },
        { label: "Explore", href: "/" },
      ]}
    />
  );
}
