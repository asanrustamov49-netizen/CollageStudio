import type { Metadata } from "next";
import { ProjectsView } from "@/components/projects/ProjectsView";

export const metadata: Metadata = { title: "Мои проекты" };

export default function ProjectsPage() {
  return <ProjectsView />;
}
