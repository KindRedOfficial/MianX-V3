import { loadAllPacks } from "@/lib/packs/bootstrap";
import {
  listDomainPacks,
  listCountryPacks,
  getDomainEntities,
  getDomainSkills,
  getDomainWorkflows,
  getDomainKnowledgeRules,
} from "@/lib/packs/registry.service";
import PacksExplorerClient from "./PacksExplorerClient";

export const dynamic = "force-dynamic";

export default async function PacksPage() {
  loadAllPacks();

  const domains = listDomainPacks().map((d) => ({
    ...d,
    entities: getDomainEntities(d.id),
    skills: getDomainSkills(d.id),
    workflows: getDomainWorkflows(d.id),
    knowledgeRules: getDomainKnowledgeRules(d.id),
  }));

  const countries = listCountryPacks();

  return <PacksExplorerClient domains={JSON.parse(JSON.stringify(domains))} countries={JSON.parse(JSON.stringify(countries))} />;
}
