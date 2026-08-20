import { NextResponse } from "next/server";
import { loadAllPacks } from "@/lib/packs/bootstrap";
import {
  listDomainPacks,
  listCountryPacks,
  getDomainEntities,
  getDomainSkills,
  getDomainWorkflows,
  getDomainKnowledgeRules,
} from "@/lib/packs/registry.service";

export async function GET() {
  // Ensure packs are loaded (safe to call multiple times)
  loadAllPacks();

  const domains = listDomainPacks().map((d) => ({
    ...d,
    entities: getDomainEntities(d.id),
    skills: getDomainSkills(d.id),
    workflows: getDomainWorkflows(d.id),
    knowledgeRules: getDomainKnowledgeRules(d.id),
  }));

  const countries = listCountryPacks();

  return NextResponse.json({ domains, countries });
}
