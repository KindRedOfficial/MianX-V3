> Build Version: 1.0.1 (Final Auth Fix)

# MianX.ai V3 — The Agentic AI Operating System

> **Give your team a goal. MianX turns it into action.**

MianX.ai is an AI-native enterprise platform designed to evolve from an AI Operating System into a fully **Agentic AI Operating System for Modern Teams**. Instead of just generating responses, MianX V3 autonomously plans missions, assembles an AI workforce, executes tasks using secure tools, verifies outcomes, and learns from results.

---

## The Agentic Execution Loop

MianX V3 is built around a core autonomous loop that ensures tasks are actually completed, not just simulated.

```text
USER GOAL
   |
MISSION ENGINE (Plan, Budget, Success Criteria)
   |
AGENT WORKFORCE (Dynamic Selection & Delegation)
   |
TOOL RUNTIME (Secure, Sandboxed Execution)
   |
VERIFICATION ENGINE (Evidence-based Completion)
   |
OUTCOME ENGINE (Baseline -> Target -> Achieved)
   |
TRUST CENTER (Audit Trail & Transparency)
```

---

## Architecture Overview

```text
mianx-v3/
+-- prisma/
|   +-- schema.prisma          # Mission, Agent, Tool, Outcome, Audit, Pack models
|   +-- dev.db                 # SQLite development database
+-- src/
|   +-- app/
|   |   +-- (auth)/            # NextAuth authentication (credentials + GitHub)
|   |   +-- (dashboard)/       # Main app shell
|   |   |   +-- layout.tsx     # Sidebar + TopBar + dark theme
|   |   |   +-- page.tsx       # Command Center (goal input + mission timeline + agent grid)
|   |   |   +-- missions/
|   |   |   |   +-- [id]/
|   |   |   |       +-- page.tsx              # Mission detail (server component)
|   |   |   |       +-- MissionDetailClient.tsx # Mission detail UI (client)
|   |   |   |       +-- trust-center/
|   |   |   |           +-- page.tsx           # Trust Center (server component)
|   |   |   |           +-- TrustCenterClient.tsx
|   |   |   +-- packs/
|   |   |       +-- page.tsx                   # Domain & Country Pack explorer
|   |   |       +-- PacksExplorerClient.tsx
|   |   +-- api/
|   |       +-- missions/
|   |       |   +-- route.ts            # POST: create mission + plan tasks
|   |       |   +-- [id]/
|   |       |       +-- route.ts        # GET: mission detail
|   |       |       +-- run/route.ts    # POST: trigger agentic execution
|   |       |       +-- audit/route.ts  # GET: audit logs + outcome
|   |       +-- agents/
|   |       |   +-- route.ts            # GET: list agents
|   |       |   +-- [id]/delegate/route.ts  # POST: delegate task to agent
|   |       +-- packs/
|   |       |   +-- route.ts            # GET: list all packs
|   |       |   +-- [domainId]/context/route.ts  # GET: resolve domain+country context
|   |       +-- admin/
|   |       |   +-- route.ts            # Admin endpoints (role-gated)
|   |       +-- stripe/
|   |           +-- webhook/route.ts    # Stripe webhook with state machine
|   +-- components/
|   |   +-- Sidebar.tsx           # Navigation sidebar
|   |   +-- TopBar.tsx            # Top bar with user menu
|   |   +-- ui/                   # shadcn/ui primitives
|   +-- lib/
|   |   +-- ai/
|   |   |   +-- planner.service.ts          # LLM-powered mission planner
|   |   |   +-- agent-registry.service.ts   # Agent selection algorithm
|   |   |   +-- delegation.service.ts       # Task delegation with security checks
|   |   |   +-- tool-executor.service.ts    # 4-layer secure tool execution
|   |   |   +-- verification.service.ts     # Evidence-based completion verification
|   |   |   +-- outcome.service.ts          # Outcome tracking (baseline/target/achieved)
|   |   |   +-- audit.service.ts            # Audit log service
|   |   |   +-- orchestrator.service.ts     # Agentic ReAct loop orchestrator
|   |   +-- packs/
|   |   |   +-- types.ts                    # Pack contracts (Domain + Country)
|   |   |   +-- registry.service.ts         # In-memory pack registry
|   |   |   +-- poultry.domain.ts           # Poultry farming domain pack
|   |   |   +-- pakistan.country.ts         # Pakistan country pack
|   |   |   +-- bootstrap.ts                # Server-start pack loader
|   |   +-- auth.ts                         # NextAuth configuration
|   |   +-- db.ts                           # Prisma client singleton
|   |   +-- stripe.ts                       # Lazy Stripe client
|   |   +-- openai.ts                       # Lazy OpenAI client
|   |   +-- anthropic.ts                    # Lazy Anthropic client
|   |   +-- redis.ts                        # Lazy Upstash Redis client
|   +-- generated/prisma/client/            # Generated Prisma client (gitignored)
+-- scripts/
|   +-- seed-tools.ts                       # Tool seeding script
+-- instrumentation.ts                      # Next.js server-start hook (pack bootstrap)
```

---

## Key Features

### Mission Engine
- **Natural Language Goals** — Describe what you want in plain language. The LLM Planner decomposes it into structured tasks with dependencies, success criteria, and budgets.
- **Multi-Task Orchestration** — Missions contain ordered tasks with dependency graphs. The orchestrator processes them in topological order, ensuring prerequisites are met.

### Agent Workforce
- **Dynamic Agent Selection** — The Agent Selection Algorithm filters agents by capability superset, checks risk hierarchy compliance, and ranks by cost efficiency.
- **Secure Delegation** — Tasks are delegated with tool-subset authorization, risk-level enforcement, and escalation prevention. A HIGH-risk agent can never be assigned to a CRITICAL-risk task.

### Tool Runtime
- **4-Layer Security Chain** — Every tool invocation passes through: Existence Check > Enabled Check > Zod Schema Validation > Agent Authorization. Four precise error types for each failure mode.
- **Dynamic Zod Schemas** — Tool input/output schemas are stored as JSON Schema in the database and compiled to Zod validators at runtime.
- **Risk Levels** — Tools are classified as LOW, MEDIUM, HIGH, or CRITICAL. Agent-tool authorization is enforced by risk hierarchy.

### Verification Engine
- **Evidence-Based Completion** — Tasks aren't marked complete just because an agent says so. The Verification Engine checks output against success criteria using heuristic code detection and criteria matching.
- **Auto-Repair Signal** — When verification fails, the task is marked FAILED with a "Repair needed" audit entry, triggering re-processing.

### Outcome Engine
- **Baseline to Achieved** — Every mission tracks a numeric outcome from a baseline value through a target. Status automatically computes: IN_PROGRESS > NEAR_TARGET (90%+) > ACHIEVED (100%+).
- **Bidirectional Metrics** — Supports both "higher is better" (revenue) and "lower is better" (error rate) outcome tracking.

### Trust Center
- **Full Audit Trail** — Every agent action is logged with timestamp, agent identity, action taken, result, and cost. Owned by the mission, visible only to the creator.
- **Real-Time Outcome Tracking** — Progress bar and status badge update live during mission execution.

### Domain & Country Packs
- **Domain Packs** — Industry-specific knowledge modules containing entities, skills, workflows, and knowledge rules. Example: Poultry Farming pack with flock health analysis, feed conversion prediction, and mortality tracking.
- **Country Packs** — Localization modules with tax configuration, payment providers, and compliance rules. Example: Pakistan pack with 16% GST, JazzCash/Easypaisa payments, and FBR/PDPA/DAPRA compliance.
- **In-Memory Registry** — Zero-latency pack resolution via Map-based registry, loaded at server start via `instrumentation.ts`.
- **Context Resolution** — `resolvePackContext(domainId, countryId)` combines domain entities, skills, workflows, knowledge rules with country-specific tax, payment, and compliance data.

### Agentic Execution Loop
- **ReAct Pattern** — The Orchestrator implements a Reasoning + Acting loop: LLM decides action > Tool is invoked > Observation is fed back > LLM decides next step. Maximum 3 tool calls per task.
- **Dependency-Ordered Execution** — Tasks are sorted topologically before execution. Completed prerequisites unlock dependent tasks.
- **Live UI Updates** — The Mission Detail page polls every 3 seconds during execution, showing real-time task status changes and audit log entries.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Prisma v7 + SQLite (better-sqlite3) |
| Auth | NextAuth v5 (credentials + GitHub OAuth) |
| AI | OpenAI GPT-4o / Anthropic Claude (lazy init) |
| Payments | Stripe (webhook state machine) |
| Caching | Upstash Redis (rate limiting) |
| Storage | Supabase Storage (deliverables) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/KindRedOfficial/MianX-V3.git
cd MianX-V3
npm install
```

### Setup Environment

```bash
cp .env.example .env
# Edit .env with your credentials:
# - NEXTAUTH_SECRET=
# - NEXTAUTH_URL=http://localhost:3000
# - DATABASE_URL="file:./prisma/dev.db"
# - OPENAI_API_KEY=          (optional, mock provider used if absent)
# - ANTHROPIC_API_KEY=       (optional)
# - STRIPE_SECRET_KEY=       (optional)
# - UPSTASH_REDIS_REST_URL=  (optional)
# - SUPABASE_URL=            (optional)
# - SUPABASE_ANON_KEY=       (optional)
```

### Database Setup

```bash
npx prisma db push
npx prisma generate
npm run seed-tools    # Seed tool definitions
```

### Development

```bash
npm run dev
# Open http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
```

---

## Security Model

MianX V3 implements defense-in-depth across every layer:

1. **Authentication** — NextAuth session-based auth on all API routes
2. **Authorization** — Ownership checks (mission belongs to user) and role-gated admin endpoints
3. **Agent Risk Hierarchy** — LOW < MEDIUM < HIGH < CRITICAL. Agents can only handle tasks at or below their level.
4. **Tool Security Chain** — 4-layer validation (exists > enabled > schema > authorized) with typed errors
5. **Delegation Boundaries** — Agents receive only the tool subset they need. No escalation.
6. **Rate Limiting** — Upstash Redis per-user rate limits on AI endpoints
7. **Credit System** — AI cost tracking with organizational quota enforcement
8. **Webhook Integrity** — Stripe webhook state machine prevents double-processing

---

## Data Model

```text
User 1---* Mission 1---* MissionTask
                |
                +---1 Outcome
                +---* AuditLog

Agent (registry)     Tool (registry)
    |                      |
    +--- delegation ----+  +--- execution ----+
                                              |
DomainPack 1---* DomainEntity
           1---* DomainSkill
           1---* DomainWorkflow 1---* WorkflowStep
           1---* KnowledgeRule

CountryPack 1---* CountryTaxConfig
            1---* PaymentProvider
            1---* ComplianceRule
```

---

## Project Status

| Phase | Description | Status |
|---|---|---|
| Phase 0 | Project scaffolding, auth, database | Done |
| Phase 1 | Mission Engine + LLM Planner | Done |
| Phase 2 | P0 Bug fixes (webhook, auth, rate limit, deliverables) | Done |
| Phase 3 | Command Center UI (dark theme, sidebar, agent grid) | Done |
| Phase 4 | Tool Runtime + Verification Engine | Done |
| Phase 5 | Outcome Engine + Trust Center | Done |
| Phase 6 | Domain & Country Pack Infrastructure | Done |
| Phase 7 | Agentic Execution Loop (Orchestrator + Live UI) | Done |

---

## License

Private repository. All rights reserved.
