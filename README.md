# Markdocs

A **Confluence-like platform** built exclusively for Markdown files. Zero friction. No lock-in.

## Why Markdocs?

Confluence is powerful but heavy. Notion is sleek but proprietary. Markdocs gives you the best of both worlds:

- **Files are just `.md`** -- no vendor lock-in, no proprietary formats
- **Instant editor** -- split-pane with live preview, powered by CodeMirror
- **Wiki-style linking** -- `[[Page Name]]` syntax to cross-reference docs
- **One-click sharing** -- generate public links instantly
- **Full-text search** -- find anything across all documents
- **Templates** -- meeting notes, RFCs, ADRs, runbooks built-in
- **Version history** -- every save creates a version
- **Dark mode** -- because we're not animals

## Quick Start

```bash
git clone git@github.com:iadhikar/markdocs.git
cd markdocs
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | TailwindCSS |
| Editor | CodeMirror 6 |
| Markdown | react-markdown + remark-gfm + rehype |
| Database | SQLite (via better-sqlite3) |
| Search | SQLite LIKE queries (FTS5 ready) |

## Features

### Spaces and Documents
Organize your docs into **Spaces** (like Confluence spaces). Each space contains documents that can be nested.

### Live Editor
Three view modes: **Edit** (full-screen markdown editor), **Preview** (rendered markdown view), **Split** (side-by-side editor + preview, default).

### Wiki Links
Reference other documents using `[[Page Name]]` syntax. Click to navigate.

### Templates
Start new documents from built-in templates: Meeting Notes, RFC, ADR, Runbook.

### Sharing
Generate a public share link for any document. Revoke anytime.

### Search
Press `/` to open search. Searches across titles, content, and tags.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Open search |
| `Ctrl/Cmd + S` | Save document |
| `Ctrl/Cmd + N` | New document |

### Export
Download documents as Markdown (.md) or HTML (.html).

### Dark Mode
Toggle with the moon/sun icon in the sidebar footer.

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/spaces` | GET, POST | List/create spaces |
| `/api/spaces/:id` | GET, PUT, DELETE | CRUD space |
| `/api/documents` | GET, POST | List/create documents |
| `/api/documents/:id` | GET, PUT, DELETE | CRUD document |
| `/api/documents/:id/share` | POST, DELETE | Create/revoke share link |
| `/api/documents/:id/versions` | GET | Version history |
| `/api/documents/:id/export` | GET | Export (format=md or html) |
| `/api/search?q=` | GET | Full-text search |
| `/api/share/:shareId` | GET | Public shared doc |

## Project Structure

```
src/
  app/
    api/           -- REST API routes
    share/         -- Public shared doc pages
    globals.css    -- Global styles + prose styles
    layout.tsx     -- Root layout
    page.tsx       -- Main app page
  components/
    CodeMirrorEditor.tsx   -- CodeMirror wrapper
    Editor.tsx             -- Full editor with toolbar
    MarkdownRenderer.tsx   -- MD renderer with wiki links
    NewDocModal.tsx        -- Create doc dialog
    NewSpaceModal.tsx      -- Create space dialog
    SearchModal.tsx        -- Search overlay
    Sidebar.tsx            -- Navigation sidebar
    WelcomeView.tsx        -- Landing/home view
  hooks/
    useDocuments.ts        -- Data hooks
  lib/
    db.ts                  -- SQLite database
    types.ts               -- TypeScript types
```

## License

MIT
