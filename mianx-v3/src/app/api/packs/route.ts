import { NextResponse } from "next/server";
import {
  listDomainPacks,
  listCountryPacks,
  getDomainEntities,
  getDomainSkills,
  getDomainWorkflows,
  getDomainKnowledgeRules,
} from "@/lib/packs/registry.service";

export async function GET() {
  const [domainList, countries] = await Promise.all([
    listDomainPacks(),
    listCountryPacks(),
  ]);

  const domains = await Promise.all(
    domainList.map(async (d) => ({
      ...d,
      entities: await getDomainEntities(d.id),
      skills: await getDomainSkills(d.id),
      workflows: await getDomainWorkflows(d.id),
      knowledgeRules: await getDomainKnowledgeRules(d.id),
    })),
  );

  return NextResponse.json({ domains, countries });
}
