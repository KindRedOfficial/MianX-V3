import { prisma } from "@/lib/prisma";
import AgentsGridClient from "./AgentsGridClient";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return <AgentsGridClient agents={JSON.parse(JSON.stringify(agents))} />;
}
