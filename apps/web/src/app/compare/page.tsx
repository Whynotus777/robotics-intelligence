import { Placeholder } from "@/components/placeholder";

export const metadata = { title: "Compare" };

export default function ComparePage() {
  return (
    <Placeholder
      title="Compare"
      question="How does it compare"
      body="Two to four entities of the same type as columns, rows grouped by stack layer, and a row only where at least two columns have a value. The compare route and its fixture exist; the screen arrives with the comparison marks from @ri/viz."
      doors={[
        { label: "Unitree G1", href: "/r/unitree-g1" },
        { label: "Figure 03", href: "/r/figure-03" },
        { label: "Apptronik Apollo", href: "/r/apptronik-apollo" },
      ]}
    />
  );
}
