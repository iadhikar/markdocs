import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

export interface SpaceRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  space_id: string;
  title: string;
  slug: string;
  content: string;
  parent_id: string | null;
  position: number;
  tags: string;
  share_id: string | null;
  is_template: number;
  template_name: string | null;
  views: number;
  is_favorite: number;
  created_at: string;
  updated_at: string;
}

export interface VersionRow {
  id: number;
  document_id: string;
  content: string;
  title: string;
  created_at: string;
}

export interface ListingRow {
  id: string;
  seller_name: string;
  title: string;
  description: string;
  price_cents: number;
  content: string;
  preview: string;
  tags: string;
  category: string;
  downloads: number;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  listing_id: string;
  buyer_email: string;
  amount_cents: number;
  stripe_session_id: string | null;
  status: "pending" | "completed" | "free";
  created_at: string;
}

export interface DbSchema {
  spaces: Record<string, SpaceRow>;
  documents: Record<string, DocumentRow>;
  versions: VersionRow[];
  nextVersionId: number;
  listings: Record<string, ListingRow>;
  orders: OrderRow[];
}

function now(): string {
  return new Date().toISOString();
}

function seed(): DbSchema {
  const db: DbSchema = { spaces: {}, documents: {}, versions: [], nextVersionId: 1, listings: {}, orders: [] };

  db.spaces["default"] = {
    id: "default", name: "General", slug: "general",
    description: "Default workspace for your documents", icon: "\u{1F4DA}",
    created_at: now(), updated_at: now(),
  };

  db.documents["welcome"] = {
    id: "welcome", space_id: "default", title: "Welcome to Markdocs",
    slug: "welcome-to-markdocs",
    content: "# Welcome to Markdocs\n\nMarkdocs is a **Confluence-like platform** built exclusively for Markdown files.\n\n## Key Features\n\n- **Spaces & Folders** \u2014 Organize docs into workspaces\n- **Live Editor** \u2014 Split-pane editor with instant preview\n- **Wiki Linking** \u2014 Use `[[Page Name]]` to cross-reference documents\n- **Full-text Search** \u2014 Find anything instantly\n- **Share Links** \u2014 One-click public sharing\n- **Templates** \u2014 Meeting notes, RFCs, ADRs, and more\n- **Version History** \u2014 Track every change\n- **Tags** \u2014 Categorize and filter your docs\n- **Dark Mode** \u2014 Easy on the eyes\n\n## Getting Started\n\n1. Create a **Space** to organize your documents\n2. Click **New Document** to start writing\n3. Use Markdown syntax \u2014 everything you know works here\n4. Use `[[double brackets]]` to link between documents\n\n## Markdown Examples\n\n### Tables\n\n| Feature | Status |\n|---------|--------|\n| Editor | Done |\n| Search | Done |\n| Sharing | Done |\n\n### Code Blocks\n\n```typescript\nfunction greet(name: string): string {\n  return `Hello, ${name}! Welcome to Markdocs.`;\n}\n```\n\n### Task Lists\n\n- [x] Build the editor\n- [x] Add search\n- [x] Add sharing\n- [ ] World domination\n\n> **Tip:** Press `Ctrl+S` (or `Cmd+S`) to save your document quickly.\n",
    parent_id: null, position: 0, tags: "[\"welcome\", \"getting-started\"]",
    share_id: null, is_template: 0, template_name: null,
    views: 0, is_favorite: 0,
    created_at: now(), updated_at: now(),
  };

  const templates = [
    { id: "tpl-meeting", title: "Meeting Notes", name: "meeting-notes", content: "# Meeting Notes \u2014 [Date]\n\n## Attendees\n- \n\n## Agenda\n1. \n\n## Discussion Notes\n\n\n## Action Items\n- [ ] \n\n## Next Meeting\n- **Date:**\n- **Topics:**\n" },
    { id: "tpl-rfc", title: "RFC Template", name: "rfc", content: "# RFC: [Title]\n\n**Author:** [Name]\n**Status:** Draft\n**Created:** [Date]\n\n## Summary\nOne paragraph explanation.\n\n## Motivation\nWhy are we doing this?\n\n## Detailed Design\nTechnical details.\n\n## Alternatives Considered\nOther approaches and why rejected.\n\n## Rollout Plan\nHow will this be deployed?\n\n## Open Questions\n- \n" },
    { id: "tpl-adr", title: "Architecture Decision Record", name: "adr", content: "# ADR: [Title]\n\n**Status:** Proposed | Accepted | Deprecated | Superseded\n**Date:** [Date]\n\n## Context\nWhat is the issue motivating this decision?\n\n## Decision\nWhat is the change we're proposing?\n\n## Consequences\nWhat becomes easier or harder?\n" },
    { id: "tpl-runbook", title: "Runbook", name: "runbook", content: "# Runbook: [Service Name]\n\n## Overview\nBrief description.\n\n## Prerequisites\n- Access to [system]\n\n## Steps\n\n### 1. [First Step]\n```bash\n# command\n```\n\n### 2. [Second Step]\n\n## Troubleshooting\n\n| Symptom | Cause | Fix |\n|---------|-------|-----|\n|         |       |     |\n\n## Contacts\n- **On-call:**\n- **Escalation:**\n" },
  ];

  for (const tpl of templates) {
    db.documents[tpl.id] = {
      id: tpl.id, space_id: "default", title: tpl.title, slug: tpl.name,
      content: tpl.content, parent_id: null, position: 0, tags: "[]",
      share_id: null, is_template: 1, template_name: tpl.name,
      views: 0, is_favorite: 0,
      created_at: now(), updated_at: now(),
    };
  }

  // Seed marketplace listings
  const sampleListings = [
    { id: "lst-api-guide", seller: "TechWriter", title: "Complete REST API Design Guide", desc: "A comprehensive guide to designing RESTful APIs with best practices, versioning strategies, error handling patterns, and real-world examples.", price: 799, category: "engineering", tags: '["api", "rest", "design", "backend"]', content: "# Complete REST API Design Guide\n\n## 1. Resource Naming\nUse nouns, not verbs. Use plural forms.\n\n```\nGET /api/users       -- list users\nGET /api/users/123   -- get user\nPOST /api/users      -- create user\nPUT /api/users/123   -- update user\nDELETE /api/users/123 -- delete user\n```\n\n## 2. HTTP Status Codes\n- 200 OK -- successful GET/PUT\n- 201 Created -- successful POST\n- 204 No Content -- successful DELETE\n- 400 Bad Request -- validation error\n- 401 Unauthorized -- auth required\n- 404 Not Found -- resource missing\n- 500 Internal Server Error\n\n## 3. Pagination\n```\nGET /api/users?page=2&per_page=25\n```\n\nReturn pagination metadata in response:\n```json\n{\n  \"data\": [...],\n  \"meta\": { \"page\": 2, \"per_page\": 25, \"total\": 150 }\n}\n```\n\n## 4. Versioning\nPrefer URL versioning: `/api/v1/users`\n\n## 5. Error Format\n```json\n{\n  \"error\": {\n    \"code\": \"VALIDATION_ERROR\",\n    \"message\": \"Email is required\",\n    \"details\": [{ \"field\": \"email\", \"message\": \"cannot be blank\" }]\n  }\n}\n```\n\n## 6. Authentication\nUse Bearer tokens in the Authorization header.\n\n## 7. Rate Limiting\nReturn rate limit headers:\n```\nX-RateLimit-Limit: 100\nX-RateLimit-Remaining: 95\nX-RateLimit-Reset: 1620000000\n```\n" },
    { id: "lst-onboarding", seller: "HRDocs", title: "Engineering Onboarding Playbook", desc: "Complete onboarding template for new engineering hires. Covers first day, first week, 30/60/90 day plans, buddy system, and knowledge transfer.", price: 499, category: "management", tags: '["onboarding", "engineering", "hr", "playbook"]', content: "# Engineering Onboarding Playbook\n\n## Before Day 1\n- [ ] Laptop ordered and configured\n- [ ] Accounts created (GitHub, Slack, email)\n- [ ] Buddy assigned\n- [ ] First week calendar pre-populated\n\n## Day 1\n- [ ] Welcome meeting with manager\n- [ ] Office/remote setup tour\n- [ ] Dev environment setup guide\n- [ ] First PR (update team page with bio)\n\n## Week 1\n- [ ] Architecture overview session\n- [ ] Meet the team 1:1s\n- [ ] Complete security training\n- [ ] Shadow a sprint planning\n- [ ] First real bug fix PR\n\n## 30-Day Goals\n- [ ] Own a small feature end-to-end\n- [ ] Participate in code review\n- [ ] On-call shadow rotation\n- [ ] Complete all compliance training\n\n## 60-Day Goals\n- [ ] Lead a feature from design to ship\n- [ ] Present at team demo\n- [ ] Contribute to documentation\n\n## 90-Day Goals\n- [ ] Full on-call rotation member\n- [ ] Mentor assessment complete\n- [ ] Career development plan drafted\n" },
    { id: "lst-incident", seller: "SREPro", title: "Incident Response Framework", desc: "Battle-tested incident response procedures. Severity levels, communication templates, post-mortem format, and escalation paths.", price: 0, category: "operations", tags: '["incident", "sre", "ops", "postmortem"]', content: "# Incident Response Framework\n\n## Severity Levels\n\n| Level | Impact | Response Time | Comms |\n|-------|--------|---------------|-------|\n| SEV1 | Full outage | 5 min | Exec + All-hands |\n| SEV2 | Major degradation | 15 min | Team + Management |\n| SEV3 | Minor issue | 1 hour | Team only |\n| SEV4 | Low impact | Next business day | Ticket |\n\n## Incident Commander Checklist\n1. Acknowledge the incident\n2. Assess severity level\n3. Open incident channel (#inc-YYYY-MM-DD)\n4. Assign roles: IC, Comms Lead, Tech Lead\n5. Begin investigation\n6. Post status updates every 15 min (SEV1/2)\n7. Resolve and verify\n8. Schedule post-mortem within 48 hours\n\n## Communication Template\n```\n[SEV{X}] {Service} - {Brief Description}\nImpact: {User-facing impact}\nStatus: Investigating / Identified / Monitoring / Resolved\nNext update: {Time}\n```\n\n## Post-Mortem Template\n- **Date:** \n- **Duration:**\n- **Impact:**\n- **Root Cause:**\n- **Timeline:**\n- **What went well:**\n- **What went wrong:**\n- **Action items:**\n" },
    { id: "lst-typescript", seller: "DevPatterns", title: "TypeScript Design Patterns Handbook", desc: "20+ design patterns implemented in TypeScript with practical examples. Singleton, Factory, Observer, Strategy, and more.", price: 1299, category: "engineering", tags: '["typescript", "patterns", "design", "code"]', content: "# TypeScript Design Patterns\n\n## 1. Singleton\n```typescript\nclass Database {\n  private static instance: Database;\n  private constructor() {}\n  \n  static getInstance(): Database {\n    if (!Database.instance) {\n      Database.instance = new Database();\n    }\n    return Database.instance;\n  }\n}\n```\n\n## 2. Factory\n```typescript\ninterface Logger { log(msg: string): void; }\n\nclass ConsoleLogger implements Logger {\n  log(msg: string) { console.log(msg); }\n}\n\nclass FileLogger implements Logger {\n  log(msg: string) { fs.appendFileSync('log.txt', msg); }\n}\n\nfunction createLogger(type: 'console' | 'file'): Logger {\n  switch (type) {\n    case 'console': return new ConsoleLogger();\n    case 'file': return new FileLogger();\n  }\n}\n```\n\n## 3. Observer\n```typescript\ntype Listener<T> = (data: T) => void;\n\nclass EventEmitter<T> {\n  private listeners: Listener<T>[] = [];\n  \n  on(fn: Listener<T>) { this.listeners.push(fn); }\n  emit(data: T) { this.listeners.forEach(fn => fn(data)); }\n}\n```\n\n## 4. Strategy\n```typescript\ninterface SortStrategy<T> {\n  sort(data: T[]): T[];\n}\n\nclass QuickSort<T> implements SortStrategy<T> {\n  sort(data: T[]): T[] { return [...data].sort(); }\n}\n```\n" },
    { id: "lst-startup", seller: "FounderDocs", title: "Startup Technical Due Diligence Checklist", desc: "Complete checklist for evaluating a startup's technical foundation. Architecture, security, scalability, team, and tech debt assessment.", price: 1999, category: "business", tags: '["startup", "due-diligence", "architecture", "security"]', content: "# Technical Due Diligence Checklist\n\n## Architecture\n- [ ] System architecture diagram exists\n- [ ] Microservices vs monolith rationale documented\n- [ ] Database schema is normalized appropriately\n- [ ] API design follows REST/GraphQL best practices\n- [ ] Message queues for async processing\n\n## Code Quality\n- [ ] Test coverage > 70%\n- [ ] CI/CD pipeline in place\n- [ ] Code review process enforced\n- [ ] Linting and formatting automated\n- [ ] No critical security vulnerabilities\n\n## Infrastructure\n- [ ] Infrastructure as Code (Terraform/Pulumi)\n- [ ] Auto-scaling configured\n- [ ] Multi-region or DR plan\n- [ ] Monitoring and alerting (PagerDuty/Datadog)\n- [ ] Backup and recovery tested\n\n## Security\n- [ ] SOC 2 compliance (or roadmap)\n- [ ] Encryption at rest and in transit\n- [ ] Access control and audit logging\n- [ ] Dependency scanning\n- [ ] Penetration testing done\n\n## Team\n- [ ] Bus factor > 1 for critical systems\n- [ ] On-call rotation exists\n- [ ] Documentation culture\n- [ ] Knowledge sharing sessions\n" },
  ];

  for (const l of sampleListings) {
    db.listings[l.id] = {
      id: l.id, seller_name: l.seller, title: l.title, description: l.desc,
      price_cents: l.price, content: l.content,
      preview: l.content.substring(0, 200) + "...",
      tags: l.tags, category: l.category, downloads: Math.floor(Math.random() * 200) + 10,
      created_at: now(), updated_at: now(),
    };
  }

  return db;
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDb(): DbSchema {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    const db = seed();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return db;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

export function saveDb(db: DbSchema): void {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
