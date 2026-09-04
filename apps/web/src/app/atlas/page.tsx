import { Placeholder } from "@/components/placeholder";

export const metadata = { title: "Atlas" };

export default function AtlasPage() {
  return (
    <Placeholder
      title="Atlas"
      question="Where does it happen"
      body="Where robotics activity actually happens, not just where headquarters are: cluster marks by country, corridor and city, with a layer toggle for HQ, R&D, manufacturing, deployments and research. The map component comes from @ri/viz; the atlas route already serves the marks."
      doors={[
        { label: "Bay Area", href: "/e/bay-area" },
        { label: "Shenzhen", href: "/e/shenzhen" },
        { label: "Explore", href: "/" },
      ]}
    />
  );
}
