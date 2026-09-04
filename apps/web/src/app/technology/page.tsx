import { Directory } from "@/components/directory";

export const metadata = { title: "Technology" };

export default function TechnologyPage() {
  return (
    <Directory
      title="Technology"
      question="How does it work"
      entityType="TECHNOLOGY"
      intro="Component classes and software layers, each one a door into the robots that use it."
    />
  );
}
