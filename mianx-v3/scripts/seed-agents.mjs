import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

const agents = [
  { name: 'Atlas', role: 'Backend Developer', capabilities: ['API','Database','Auth','Serverless'], allowedTools: ['database_write','api_call','file_system_read','file_system_write'], riskLevel: 'HIGH', costProfile: 0.05, isActive: true },
  { name: 'Zen', role: 'Frontend Engineer', capabilities: ['UI','CSS','React','Accessibility'], allowedTools: ['file_system_read','file_system_write','browser_preview'], riskLevel: 'LOW', costProfile: 0.03, isActive: true },
  { name: 'Nexus', role: 'DevOps & Integration', capabilities: ['CI/CD','Docker','Monitoring','API'], allowedTools: ['api_call','database_read','deploy','shell_exec'], riskLevel: 'CRITICAL', costProfile: 0.08, isActive: true },
  { name: 'Sage', role: 'Data Analyst', capabilities: ['Data','Visualization','SQL','Statistics'], allowedTools: ['database_read','api_call'], riskLevel: 'MEDIUM', costProfile: 0.04, isActive: true },
];

for (const a of agents) {
  await prisma.agent.upsert({ where: { name: a.name }, create: a, update: {} });
}
console.log('Seeded', agents.length, 'agents');
await prisma.$disconnect();
