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
  const [domainList, countryList] = await Promise.all([
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

  return <PacksExplorerClient domains={JSON.parse(JSON.stringify(domains))} countries={JSON.parse(JSON.stringify(countryList))} />;
}
