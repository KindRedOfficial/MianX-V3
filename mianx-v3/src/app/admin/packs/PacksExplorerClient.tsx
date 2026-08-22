"use client";

import { useState } from "react";
import {
  Package,
  Globe,
  ChevronDown,
  ChevronRight,
  Zap,
  AlertTriangle,
  Info,
  Shield,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

type Severity = "info" | "warning" | "critical";

interface DomainEntity {
  name: string;
  description: string;
  attributes: { name: string; type: string; required: boolean; description: string }[];
  relationships: { from: string; to: string; type: string; label: string }[];
}

interface DomainSkill {
  name: string;
  description: string;
  requiredTools: string[];
  outputType: string;
}

interface WorkflowStep {
  order: number;
  name: string;
  skill: string;
  agentRole: string;
}

interface DomainWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

interface KnowledgeRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  severity: Severity;
}

interface DomainPack {
  id: string;
  name: string;
  version: string;
  entities: DomainEntity[];
  skills: DomainSkill[];
  workflows: DomainWorkflow[];
  knowledgeRules: KnowledgeRule[];
}

interface PaymentProvider {
  id: string;
  name: string;
  type: string;
  supportedCurrencies: string[];
}

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  regulatoryBody?: string;
  penalty?: string;
}

interface CountryTaxConfig {
  taxRate: number;
  taxName: string;
  taxId: string;
  hasTaxExemptCategories: boolean;
  exemptCategories?: string[];
}

interface CountryPack {
  id: string;
  name: string;
  locale: string;
  currency: string;
  timezone: string;
  taxConfig: CountryTaxConfig;
  paymentProviders: PaymentProvider[];
  complianceRules: ComplianceRule[];
}

// ─── Severity helpers ──────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<Severity, { color: string; icon: typeof Info }> = {
  info: { color: "text-blue-400", icon: Info },
  warning: { color: "text-amber-400", icon: AlertTriangle },
  critical: { color: "text-red-400", icon: Shield },
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function PacksExplorerClient({
  domains,
  countries,
}: {
  domains: DomainPack[];
  countries: CountryPack[];
}) {
  const [expandedDomain, setExpandedDomain] = useState<string | null>(
    domains[0]?.id ?? null,
  );
  const [expandedCountry, setExpandedCountry] = useState<string | null>(
    countries[0]?.id ?? null,
  );

  const activeDomain = domains.find((d) => d.id === expandedDomain);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Domain & Country Packs</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Plug-in infrastructure that makes the MianX Core domain-agnostic.
        </p>
      </div>

      {/* Domain Packs */}
      <section>
        <h2 className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] uppercase tracking-wider mb-4">
          <Package className="h-4 w-4" />
          Domain Packs
        </h2>

        <div className="space-y-3">
          {domains.map((domain) => {
            const isOpen = expandedDomain === domain.id;
            return (
              <div
                key={domain.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() =>
                    setExpandedDomain(isOpen ? null : domain.id)
                  }
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[var(--color-accent)]/20 flex items-center justify-center">
                      <Package className="h-4.5 w-4.5 text-[var(--color-accent-light)]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{domain.name}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        v{domain.version} &middot; {domain.entities.length} entities &middot;{" "}
                        {domain.skills.length} skills
                      </p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-[var(--color-muted)]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--color-muted)]" />
                  )}
                </button>

                {/* Expanded content */}
                {isOpen && activeDomain && (
                  <div className="border-t border-[var(--color-border)] px-5 py-5 space-y-6">
                    {/* Entities */}
                    <div>
                      <h3 className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-3">
                        Entities
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeDomain.entities.map((entity) => (
                          <div
                            key={entity.name}
                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3.5"
                          >
                            <p className="font-medium text-sm mb-1">
                              {entity.name}
                            </p>
                            <p className="text-xs text-[var(--color-muted)] mb-2">
                              {entity.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {entity.attributes.slice(0, 4).map((attr) => (
                                <span
                                  key={attr.name}
                                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700"
                                >
                                  {attr.name}:{attr.type}
                                </span>
                              ))}
                              {entity.attributes.length > 4 && (
                                <span className="px-2 py-0.5 rounded text-[10px] text-zinc-500">
                                  +{entity.attributes.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <h3 className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-3">
                        Skills
                      </h3>
                      <div className="space-y-2">
                        {activeDomain.skills.map((skill) => (
                          <div
                            key={skill.name}
                            className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3.5"
                          >
                            <Zap className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-mono text-sm font-medium">
                                  {skill.name}
                                </p>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">
                                  {skill.outputType}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--color-muted)]">
                                {skill.description}
                              </p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {skill.requiredTools.map((tool) => (
                                <span
                                  key={tool}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-accent)]/10 text-[var(--color-accent-light)] border border-[var(--color-accent)]/20"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Workflows */}
                    {activeDomain.workflows.length > 0 && (
                      <div>
                        <h3 className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-3">
                          Workflows
                        </h3>
                        {activeDomain.workflows.map((wf) => (
                          <div
                            key={wf.id}
                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4 mb-3"
                          >
                            <p className="font-medium text-sm mb-1">
                              {wf.name}
                            </p>
                            <p className="text-xs text-[var(--color-muted)] mb-3">
                              {wf.description}
                            </p>
                            <div className="space-y-1.5">
                              {wf.steps.map((step) => (
                                <div
                                  key={step.order}
                                  className="flex items-center gap-3 text-xs"
                                >
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[10px] font-bold text-[var(--color-accent-light)]">
                                    {step.order}
                                  </span>
                                  <span className="flex-1">{step.name}</span>
                                  <span className="text-[var(--color-muted)]">
                                    {step.agentRole}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Knowledge Rules */}
                    {activeDomain.knowledgeRules.length > 0 && (
                      <div>
                        <h3 className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-3">
                          Knowledge Rules
                        </h3>
                        <div className="space-y-2">
                          {activeDomain.knowledgeRules.map((rule) => {
                            const sev = SEVERITY_STYLES[rule.severity];
                            const SevIcon = sev.icon;
                            return (
                              <div
                                key={rule.id}
                                className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3.5"
                              >
                                <SevIcon
                                  className={`h-4 w-4 mt-0.5 flex-shrink-0 ${sev.color}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm mb-0.5">
                                    {rule.name}
                                  </p>
                                  <p className="text-xs text-[var(--color-muted)]">
                                    <span className="font-medium">If:</span>{" "}
                                    {rule.condition}
                                  </p>
                                  <p className="text-xs text-[var(--color-muted)]">
                                    <span className="font-medium">Then:</span>{" "}
                                    {rule.action}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Country Packs */}
      <section>
        <h2 className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] uppercase tracking-wider mb-4">
          <Globe className="h-4 w-4" />
          Country Packs
        </h2>

        <div className="space-y-3">
          {countries.map((country) => {
            const isOpen = expandedCountry === country.id;
            return (
              <div
                key={country.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedCountry(isOpen ? null : country.id)
                  }
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Globe className="h-4.5 w-4.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{country.name}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {country.locale} &middot; {country.currency} &middot; {country.timezone}
                      </p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-[var(--color-muted)]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--color-muted)]" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--color-border)] px-5 py-5 space-y-6">
                    {/* Tax Config */}
                    <div>
                      <h3 className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-3">
                        Tax Configuration
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-center">
                          <p className="text-xs text-[var(--color-muted)]">Rate</p>
                          <p className="text-lg font-bold mt-1">
                            {(country.taxConfig.taxRate * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-center">
                          <p className="text-xs text-[var(--color-muted)]">Name</p>
                          <p className="text-lg font-bold mt-1">
                            {country.taxConfig.taxName}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-center">
                          <p className="text-xs text-[var(--color-muted)]">Tax ID</p>
                          <p className="text-lg font-bold mt-1">
                            {country.taxConfig.taxId}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-center">
                          <p className="text-xs text-[var(--color-muted)]">
                            Exempt Cats
                          </p>
                          <p className="text-lg font-bold mt-1">
                            {country.taxConfig.hasTaxExemptCategories
                              ? country.taxConfig.exemptCategories?.length ?? 0
                              : 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Providers */}
                    <div>
                      <h3 className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-3">
                        Payment Providers
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {country.paymentProviders.map((provider) => (
                          <span
                            key={provider.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-xs"
                          >
                            <span>{provider.name}</span>
                            <span className="text-[var(--color-muted)]">
                              ({provider.type.replace("_", " ")})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Compliance Rules */}
                    {country.complianceRules.length > 0 && (
                      <div>
                        <h3 className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-3">
                          Compliance Rules
                        </h3>
                        <div className="space-y-2">
                          {country.complianceRules.map((rule) => (
                            <div
                              key={rule.id}
                              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-sm">
                                    {rule.name}
                                  </p>
                                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                                    {rule.description}
                                  </p>
                                </div>
                                {rule.regulatoryBody && (
                                  <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    {rule.regulatoryBody}
                                  </span>
                                )}
                              </div>
                              {rule.penalty && (
                                <p className="text-xs text-red-400/80 mt-2">
                                  Penalty: {rule.penalty}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
