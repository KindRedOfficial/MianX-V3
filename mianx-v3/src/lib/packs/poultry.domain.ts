import type {
  DomainPackManifest,
  DomainEntity,
  DomainSkill,
  DomainWorkflow,
  KnowledgeRule,
} from "./types";
import {
  registerDomainPack,
  registerDomainEntities,
  registerDomainSkills,
  registerDomainWorkflows,
  registerDomainKnowledgeRules,
} from "./registry.service";

// ─── Manifest ───────────────────────────────────────────────────────────────

const PoultryManifest: DomainPackManifest = {
  id: "poultry-v1",
  name: "PoultryOS",
  version: "1.0.0",
  entities: ["Flock", "FeedBatch", "MortalityRecord", "EggProduction"],
  skills: [
    "analyze_flock_health",
    "calculate_feed_conversion",
    "predict_mortality",
    "track_egg_production",
  ],
  workflows: ["daily_flock_health_check", "weekly_feed_audit"],
  knowledgeRules: [
    "temperature_threshold_warning",
    "feed_conversion_alert",
    "mortality_spike_critical",
  ],
};

// ─── Entities ───────────────────────────────────────────────────────────────

const PoultryEntities: DomainEntity[] = [
  {
    name: "Flock",
    description: "A group of birds housed together, tracked as a single unit",
    attributes: [
      { name: "flock_id", type: "string", required: true, description: "Unique identifier" },
      { name: "breed", type: "string", required: true, description: "e.g., Cobb 500, Ross 308" },
      { name: "age_weeks", type: "number", required: true, description: "Current age in weeks" },
      { name: "bird_count", type: "number", required: true, description: "Number of live birds" },
      { name: "status", type: "enum", required: true, enumValues: ["ACTIVE", "DEPLETED", "SOLD"], description: "Current status" },
      { name: "house_id", type: "string", required: false, description: "Physical house/pen" },
    ],
    relationships: [
      { from: "Flock", to: "FeedBatch", type: "one-to-many", label: "Flock consumes FeedBatches" },
      { from: "Flock", to: "MortalityRecord", type: "one-to-many", label: "Flock has MortalityRecords" },
      { from: "Flock", to: "EggProduction", type: "one-to-many", label: "Flock produces EggProduction records" },
    ],
  },
  {
    name: "FeedBatch",
    description: "A batch of feed assigned to a flock",
    attributes: [
      { name: "batch_id", type: "string", required: true, description: "Unique batch identifier" },
      { name: "feed_type", type: "enum", required: true, enumValues: ["STARTER", "GROWER", "FINISHER", "LAYER"], description: "Feed formulation type" },
      { name: "quantity_kg", type: "number", required: true, description: "Weight in kilograms" },
      { name: "cost_per_kg", type: "number", required: true, description: "Cost per kg" },
      { name: "date_issued", type: "date", required: true, description: "When feed was issued" },
    ],
    relationships: [],
  },
  {
    name: "MortalityRecord",
    description: "A single mortality event within a flock",
    attributes: [
      { name: "date", type: "date", required: true, description: "Date of mortality" },
      { name: "count", type: "number", required: true, description: "Number of birds" },
      { name: "suspected_cause", type: "string", required: false, description: "e.g., heat stress, disease" },
    ],
    relationships: [],
  },
  {
    name: "EggProduction",
    description: "Daily egg output for a layer flock",
    attributes: [
      { name: "date", type: "date", required: true, description: "Production date" },
      { name: "eggs_collected", type: "number", required: true, description: "Total eggs" },
      { name: "damaged_count", type: "number", required: false, description: "Broken/unusable eggs" },
    ],
    relationships: [],
  },
];

// ─── Skills ─────────────────────────────────────────────────────────────────

const PoultrySkills: DomainSkill[] = [
  {
    name: "analyze_flock_health",
    description: "Evaluate flock health metrics (mortality rate, weight gain, feed intake) and flag anomalies",
    requiredTools: ["read_file"],
    outputType: "HealthReport",
  },
  {
    name: "calculate_feed_conversion",
    description: "Compute FCR (Feed Conversion Ratio) and cost per kg of meat/egg output",
    requiredTools: ["read_file", "run_tests"],
    outputType: "FCRReport",
  },
  {
    name: "predict_mortality",
    description: "Predict mortality risk based on historical trends, weather, and age",
    requiredTools: ["read_file"],
    outputType: "RiskAssessment",
  },
  {
    name: "track_egg_production",
    description: "Aggregate egg production data and compare against breed standards",
    requiredTools: ["read_file"],
    outputType: "ProductionReport",
  },
];

// ─── Workflows ──────────────────────────────────────────────────────────────

const PoultryWorkflows: DomainWorkflow[] = [
  {
    id: "daily_flock_health_check",
    name: "Daily Flock Health Check",
    description: "Automated daily assessment of all active flocks",
    steps: [
      { order: 1, name: "Fetch today's mortality records", skill: "read_file", agentRole: "Atlas" },
      { order: 2, name: "Analyze health metrics", skill: "analyze_flock_health", agentRole: "Sage" },
      { order: 3, name: "Check for mortality spikes", skill: "predict_mortality", agentRole: "Sage" },
      { order: 4, name: "Generate health summary", skill: "read_file", agentRole: "Zen" },
    ],
  },
  {
    id: "weekly_feed_audit",
    name: "Weekly Feed Audit",
    description: "Calculate FCR and feed costs for the past 7 days",
    steps: [
      { order: 1, name: "Collect feed batch data", skill: "read_file", agentRole: "Atlas" },
      { order: 2, name: "Calculate FCR", skill: "calculate_feed_conversion", agentRole: "Sage" },
      { order: 3, name: "Validate calculations", skill: "run_tests", agentRole: "Atlas" },
    ],
  },
];

// ─── Knowledge Rules ────────────────────────────────────────────────────────

const PoultryKnowledgeRules: KnowledgeRule[] = [
  {
    id: "temperature_threshold_warning",
    name: "Temperature Threshold Warning",
    condition: "House temperature exceeds 35C or drops below 15C",
    action: "Alert farm manager and increase ventilation or heating",
    severity: "warning",
  },
  {
    id: "feed_conversion_alert",
    name: "Feed Conversion Alert",
    condition: "FCR exceeds breed standard by more than 10%",
    action: "Schedule feed formulation review and check feed quality",
    severity: "warning",
  },
  {
    id: "mortality_spike_critical",
    name: "Mortality Spike Critical",
    condition: "Daily mortality rate exceeds 0.5% of flock size",
    action: "Trigger immediate veterinary assessment and isolate affected house",
    severity: "critical",
  },
];

// ─── Registration ───────────────────────────────────────────────────────────

export function loadPoultryPack(): void {
  registerDomainPack(PoultryManifest);
  registerDomainEntities(PoultryManifest.id, PoultryEntities);
  registerDomainSkills(PoultryManifest.id, PoultrySkills);
  registerDomainWorkflows(PoultryManifest.id, PoultryWorkflows);
  registerDomainKnowledgeRules(PoultryManifest.id, PoultryKnowledgeRules);
}
