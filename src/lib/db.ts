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

export interface DbSchema {
  spaces: Record<string, SpaceRow>;
  documents: Record<string, DocumentRow>;
  versions: VersionRow[];
  nextVersionId: number;
}

function now(): string {
  return new Date().toISOString();
}

function seed(): DbSchema {
  const db: DbSchema = { spaces: {}, documents: {}, versions: [], nextVersionId: 1 };

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
