import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MissionDetailClient from "./MissionDetailClient";

interface PageProps {
  params: { id: string };
}

export default async function MissionDetailPage({ params }: PageProps) {
  const { id } = params;
  const mission = await prisma.mission.findUnique({
    where: { id },
    include: { tasks: { orderBy: { sortOrder: "asc" } } },
  });

  if (!mission) notFound();

  return <MissionDetailClient mission={JSON.parse(JSON.stringify(mission))} />;
}
