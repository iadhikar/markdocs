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

## Prerequisites

- **Node.js 18+** (tested with v18.20.x)
- **npm** (comes with Node.js)

## Quick Start

```bash
git clone git@github.com:iadhikar/markdocs.git
cd markdocs
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. That's it -- no database setup, no environment variables, no Docker required.

## Building for Production

```bash
# Build optimized production bundle
npm run build

# Start the production server
npm start
```

The production server runs on port 3000 by default. Override with the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Running Tests

```bash
# Run the full test suite
npm test

# Run tests in watch mode during development
npx jest --watch
```

The test suite covers the database layer including seeding, CRUD operations, version tracking, search, sharing, templates, and edge cases (17 tests total).

## Development

```bash
# Start dev server with hot reload
npm run dev

# Run linter
npm run lint

# Type check (via the build)
npm run build
```

### Data Storage

All data is stored in a `data/db.json` file in the project root. This file is created automatically on first run with seed data (a default space, welcome document, and 4 templates). The `data/` directory is git-ignored.

To reset your local data, simply delete the `data/` directory and restart the server.

## Deployment

### Deploy anywhere that runs Node.js

Markdocs is a standard Next.js application. Deploy to any platform that supports Node.js:

**Vercel (recommended for Next.js):**
```bash
npm i -g vercel
vercel
```
Note: Vercel's serverless functions have ephemeral filesystems, so `data/db.json` will reset between deployments. For persistent storage on Vercel, swap the JSON storage for a database (see [CONTRIBUTING.md](CONTRIBUTING.md)).

**Self-hosted / VPS (PM2):**
```bash
npm run build
pm2 start npm --name markdocs -- start
```

**Docker:**
```bash
docker build -t markdocs .
docker run -p 3000:3000 -v markdocs-data:/app/data markdocs
```
Note: A Dockerfile is not yet included. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add one.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | TailwindCSS 3 |
| Editor | CodeMirror 6 |
| Markdown | react-markdown + remark-gfm + rehype |
| Storage | JSON file-based (zero native dependencies) |
| Testing | Jest + ts-jest |

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

## REST API

All data is accessible via a REST API. See [API.md](docs/API.md) for full documentation.

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
markdocs/
  src/
    app/
      api/              -- REST API routes
      share/            -- Public shared doc pages
      globals.css       -- Global styles + markdown prose
      layout.tsx        -- Root layout
      page.tsx          -- Main app (client-side SPA)
    components/
      CodeMirrorEditor  -- CodeMirror 6 wrapper
      Editor            -- Full editor with toolbar, tags, sharing
      MarkdownRenderer  -- Renders MD with wiki link support
      NewDocModal       -- Create document dialog
      NewSpaceModal     -- Create space dialog
      SearchModal       -- Full-text search overlay
      Sidebar           -- Navigation sidebar with spaces/docs tree
      WelcomeView       -- Landing page with quick actions
    hooks/
      useDocuments.ts   -- React hooks for spaces, documents, search
    lib/
      db.ts             -- JSON file-based storage layer
      types.ts          -- TypeScript interfaces
    __tests__/
      db.test.ts        -- Database layer tests (17 tests)
  docs/
    API.md              -- Full API documentation
    CONTRIBUTING.md     -- How to contribute
  jest.config.js        -- Jest configuration
  tailwind.config.ts    -- TailwindCSS configuration
  tsconfig.json         -- TypeScript configuration
```

## License

MIT
