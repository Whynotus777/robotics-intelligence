import { Directory } from "@/components/directory";

export const metadata = { title: "Robots" };

export default function RobotsPage() {
  return (
    <Directory
      title="Robots"
      question="What exists"
      entityType="ROBOT"
      intro="Every robot with a profile. Open one to read its stack, its markets and the evidence behind each fact."
    />
  );
}
