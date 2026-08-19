import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed agents
  const agents = [
    {
      name: "Atlas",
      role: "Backend Developer",
      capabilities: ["API", "Database", "Auth", "Serverless"],
      allowedTools: ["database_write", "api_call", "file_system_read", "file_system_write"],
      riskLevel: "HIGH" as const,
      costProfile: 0.05,
      isActive: true,
    },
    {
      name: "Zen",
      role: "Frontend Engineer",
      capabilities: ["UI", "CSS", "React", "Accessibility"],
      allowedTools: ["file_system_read", "file_system_write", "browser_preview"],
      riskLevel: "LOW" as const,
      costProfile: 0.03,
      isActive: true,
    },
    {
      name: "Nexus",
      role: "DevOps & Integration",
      capabilities: ["CI/CD", "Docker", "Monitoring", "API"],
      allowedTools: ["api_call", "database_read", "deploy", "shell_exec"],
      riskLevel: "CRITICAL" as const,
      costProfile: 0.08,
      isActive: true,
    },
    {
      name: "Sage",
      role: "Data Analyst",
      capabilities: ["Data", "Visualization", "SQL", "Statistics"],
      allowedTools: ["database_read", "api_call"],
      riskLevel: "MEDIUM" as const,
      costProfile: 0.04,
      isActive: true,
    },
  ];

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { name: agent.name },
      create: agent,
      update: {},
    });
  }

  console.log("Seeded", agents.length, "agents");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); });
