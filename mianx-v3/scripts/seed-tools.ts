import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function seed() {
  // Seed tools
  const runTests = await prisma.tool.upsert({
    where: { name: "run_tests" },
    update: {},
    create: {
      name: "run_tests",
      description: "Execute test suites and return pass/fail results",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          missionId: { type: "string" },
          testPattern: { type: "string" },
        },
        required: ["taskId"],
      },
      outputSchema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          output: { type: "string" },
          testCount: { type: "number" },
          failedCount: { type: "number" },
        },
      },
      riskLevel: "MEDIUM",
    },
  });

  const readFile = await prisma.tool.upsert({
    where: { name: "read_file" },
    update: {},
    create: {
      name: "read_file",
      description: "Read file contents from the project workspace",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          encoding: { type: "string" },
        },
        required: ["path"],
      },
      outputSchema: {
        type: "object",
        properties: {
          content: { type: "string" },
          path: { type: "string" },
          size: { type: "number" },
        },
      },
      riskLevel: "LOW",
    },
  });

  console.log("Seeded tools:", runTests.name, readFile.name);

  // Update agents to reference tool names in allowedTools
  await prisma.agent.update({
    where: { name: "Atlas" },
    data: { allowedTools: ["run_tests", "read_file"] },
  });
  await prisma.agent.update({
    where: { name: "Zen" },
    data: { allowedTools: ["read_file"] },
  });
  await prisma.agent.update({
    where: { name: "Nexus" },
    data: { allowedTools: ["run_tests", "read_file"] },
  });
  await prisma.agent.update({
    where: { name: "Sage" },
    data: { allowedTools: ["read_file"] },
  });

  console.log("Updated agent allowedTools");
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));
