import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TrustCenterClient from "./TrustCenterClient";

interface PageProps {
  params: { id: string };
}

export default async function TrustCenterPage({ params }: PageProps) {
  const { id } = params;

  const mission = await prisma.mission.findUnique({
    where: { id },
    select: { id: true, normalizedGoal: true, status: true },
  });

  if (!mission) notFound();

  // Fetch audit logs and outcome directly (server component)
  const [auditLogs, outcome] = await Promise.all([
    prisma.auditLog.findMany({
      where: { missionId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.outcome.findUnique({
      where: { missionId: id },
    }),
  ]);

  return (
    <TrustCenterClient
      mission={mission}
      auditLogs={JSON.parse(JSON.stringify(auditLogs))}
      outcome={outcome ? JSON.parse(JSON.stringify(outcome)) : null}
    />
  );
}
