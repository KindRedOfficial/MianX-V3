// ─── Domain Pack ─────────────────────────────────────────────────────────────

/**
 * A Domain Pack defines a vertical industry context.
 * It provides entities, skills, workflows, and knowledge rules
 * that the MianX Core uses to plan and execute missions.
 */
export interface DomainPackManifest {
  id: string;
  name: string; // e.g., "PoultryOS"
  version: string;
  entities: string[]; // e.g., ["Flock", "Feed", "Inventory"]
  skills: string[];
  workflows: string[];
  knowledgeRules: string[];
}

/**
 * Each entity in a domain has typed attributes that
 * agents use to understand the data model.
 */
export interface DomainEntity {
  name: string; // e.g., "Flock"
  description: string;
  attributes: EntityAttribute[];
  relationships: EntityRelationship[];
}

export interface EntityAttribute {
  name: string; // e.g., "age_weeks"
  type: "string" | "number" | "boolean" | "date" | "enum";
  required: boolean;
  enumValues?: string[]; // if type === "enum"
  description: string;
}

export interface EntityRelationship {
  from: string; // entity name
  to: string; // entity name
  type: "one-to-many" | "many-to-many" | "one-to-one";
  label: string; // e.g., "Flock has many FeedBatches"
}

/**
 * A skill is a discrete capability that domain agents can perform.
 */
export interface DomainSkill {
  name: string; // e.g., "analyze_flock_health"
  description: string;
  requiredTools: string[];
  outputType: string;
}

/**
 * A workflow is a multi-step process template within a domain.
 */
export interface DomainWorkflow {
  id: string;
  name: string; // e.g., "Daily Flock Health Check"
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  order: number;
  name: string;
  skill: string; // references a DomainSkill name
  agentRole: string; // e.g., "Atlas"
}

/**
 * A knowledge rule is a domain-specific heuristic or business rule.
 */
export interface KnowledgeRule {
  id: string;
  name: string;
  condition: string; // human-readable rule description
  action: string; // what to do when condition is met
  severity: "info" | "warning" | "critical";
}

// ─── Country Pack ───────────────────────────────────────────────────────────

/**
 * A Country Pack provides localization, payment, tax, and compliance
 * context that the Core uses when planning missions.
 */
export interface CountryPackManifest {
  id: string;
  name: string; // e.g., "Pakistan"
  locale: string;
  currency: string;
  timezone: string;
  taxConfig: CountryTaxConfig;
  paymentProviders: PaymentProvider[];
  complianceRules: ComplianceRule[];
}

export interface CountryTaxConfig {
  taxRate: number; // e.g., 0.16 for 16% GST in Pakistan
  taxName: string; // e.g., "GST"
  taxId: string; // e.g., "STRN" (Sales Tax Return Number)
  hasTaxExemptCategories: boolean;
  exemptCategories?: string[];
}

export interface PaymentProvider {
  id: string; // e.g., "jazzcash"
  name: string; // e.g., "JazzCash"
  type: "mobile_wallet" | "bank_transfer" | "card" | "international";
  supportedCurrencies: string[];
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  regulatoryBody?: string; // e.g., "FBR" (Federal Board of Revenue)
  penalty?: string; // e.g., "PKR 50,000 fine"
}

// ─── Combined Pack Context ──────────────────────────────────────────────────

/**
 * The resolved context that agents receive when a mission is
 * scoped to a specific domain + country combination.
 */
export interface PackContext {
  domain: DomainPackManifest;
  country: CountryPackManifest;
  resolvedAt: string; // ISO timestamp
  entities: DomainEntity[];
  skills: DomainSkill[];
  workflows: DomainWorkflow[];
  knowledgeRules: KnowledgeRule[];
}

// ─── Registry Types ─────────────────────────────────────────────────────────

export interface PackRegistration {
  domainPackId: string;
  countryPackId: string;
  activatedAt: string;
}
