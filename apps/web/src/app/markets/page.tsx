import { Directory } from "@/components/directory";

export const metadata = { title: "Markets" };

export default function MarketsPage() {
  return (
    <Directory
      title="Markets"
      question="Where is it used"
      entityType="MARKET"
      intro="Sectors and their domains. Each opens a task maturity board: where robotics is commercially real, and where it is still a demo."
    />
  );
}
