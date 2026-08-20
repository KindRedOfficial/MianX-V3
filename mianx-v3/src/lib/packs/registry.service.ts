import type {
  DomainPackManifest,
  CountryPackManifest,
  PackContext,
  DomainEntity,
  DomainSkill,
  DomainWorkflow,
  KnowledgeRule,
} from "./types";

// ─── In-Memory Registries ──────────────────────────────────────────────────

const domainPacks = new Map<string, DomainPackManifest>();
const countryPacks = new Map<string, CountryPackManifest>();
const domainEntities = new Map<string, DomainEntity[]>();
const domainSkills = new Map<string, DomainSkill[]>();
const domainWorkflows = new Map<string, DomainWorkflow[]>();
const domainKnowledgeRules = new Map<string, KnowledgeRule[]>();

// ─── Domain Pack Registration ──────────────────────────────────────────────

export function registerDomainPack(pack: DomainPackManifest): void {
  if (domainPacks.has(pack.id)) {
    throw new Error(`Domain pack already registered: ${pack.id}`);
  }
  domainPacks.set(pack.id, pack);
  console.log(`[PACK_REGISTRY] Registered domain pack: ${pack.name} v${pack.version}`);
}

export function registerDomainEntities(
  domainPackId: string,
  entities: DomainEntity[],
): void {
  if (!domainPacks.has(domainPackId)) {
    throw new Error(`Cannot register entities for unknown domain pack: ${domainPackId}`);
  }
  domainEntities.set(domainPackId, entities);
}

export function registerDomainSkills(
  domainPackId: string,
  skills: DomainSkill[],
): void {
  if (!domainPacks.has(domainPackId)) {
    throw new Error(`Cannot register skills for unknown domain pack: ${domainPackId}`);
  }
  domainSkills.set(domainPackId, skills);
}

export function registerDomainWorkflows(
  domainPackId: string,
  workflows: DomainWorkflow[],
): void {
  if (!domainPacks.has(domainPackId)) {
    throw new Error(`Cannot register workflows for unknown domain pack: ${domainPackId}`);
  }
  domainWorkflows.set(domainPackId, workflows);
}

export function registerDomainKnowledgeRules(
  domainPackId: string,
  rules: KnowledgeRule[],
): void {
  if (!domainPacks.has(domainPackId)) {
    throw new Error(`Cannot register knowledge rules for unknown domain pack: ${domainPackId}`);
  }
  domainKnowledgeRules.set(domainPackId, rules);
}

// ─── Country Pack Registration ─────────────────────────────────────────────

export function registerCountryPack(pack: CountryPackManifest): void {
  if (countryPacks.has(pack.id)) {
    throw new Error(`Country pack already registered: ${pack.id}`);
  }
  countryPacks.set(pack.id, pack);
  console.log(`[PACK_REGISTRY] Registered country pack: ${pack.name} (${pack.locale})`);
}

// ─── Query Functions ───────────────────────────────────────────────────────

export function getDomainPack(id: string): DomainPackManifest | undefined {
  return domainPacks.get(id);
}

export function getCountryPack(id: string): CountryPackManifest | undefined {
  return countryPacks.get(id);
}

export function listDomainPacks(): DomainPackManifest[] {
  return Array.from(domainPacks.values());
}

export function listCountryPacks(): CountryPackManifest[] {
  return Array.from(countryPacks.values());
}

export function getDomainEntities(domainPackId: string): DomainEntity[] {
  return domainEntities.get(domainPackId) ?? [];
}

export function getDomainSkills(domainPackId: string): DomainSkill[] {
  return domainSkills.get(domainPackId) ?? [];
}

export function getDomainWorkflows(domainPackId: string): DomainWorkflow[] {
  return domainWorkflows.get(domainPackId) ?? [];
}

export function getDomainKnowledgeRules(domainPackId: string): KnowledgeRule[] {
  return domainKnowledgeRules.get(domainPackId) ?? [];
}

// ─── Pack Context Resolution ───────────────────────────────────────────────

/**
 * Resolve a combined PackContext from a domain + country pair.
 * This is what agents receive at mission planning time.
 */
export function resolvePackContext(
  domainPackId: string,
  countryPackId: string,
): PackContext {
  const domain = getDomainPack(domainPackId);
  if (!domain) {
    throw new Error(`Domain pack not found: ${domainPackId}`);
  }

  const country = getCountryPack(countryPackId);
  if (!country) {
    throw new Error(`Country pack not found: ${countryPackId}`);
  }

  return {
    domain,
    country,
    resolvedAt: new Date().toISOString(),
    entities: getDomainEntities(domainPackId),
    skills: getDomainSkills(domainPackId),
    workflows: getDomainWorkflows(domainPackId),
    knowledgeRules: getDomainKnowledgeRules(domainPackId),
  };
}
