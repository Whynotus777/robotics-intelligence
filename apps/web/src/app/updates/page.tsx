import { Placeholder } from "@/components/placeholder";
import { WhatsChanging } from "@/components/whats-changing";

export const metadata = { title: "Updates" };

/**
 * Updates is a placeholder until the change feed has events: the strip renders
 * whatever the updates route returns and stays silent when it returns nothing.
 */
export default function UpdatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <Placeholder
        title="Updates"
        question="What is changing"
        body="A dense, filterable feed of change events generated from the data itself — new deployment, new robot, spec change, status change, new source — each with the entity, the before and after value, and the evidence chip. No change events are recorded yet, so the feed shows nothing rather than inventing a first entry."
        doors={[
          { label: "Explore", href: "/" },
          { label: "Wind", href: "/m/wind" },
          { label: "Unitree G1", href: "/r/unitree-g1" },
        ]}
      />
      <WhatsChanging limit={50} />
    </div>
  );
}
