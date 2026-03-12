# Contributing to Markdocs

Thanks for your interest in contributing! This guide will help you get set up.

## Development Setup

```bash
git clone git@github.com:iadhikar/markdocs.git
cd markdocs
npm install
npm run dev
```

The dev server starts at http://localhost:3000 with hot reload enabled.

## Project Overview

Markdocs is a Next.js 14 application using the App Router. The frontend is a client-side SPA (`"use client"`) that communicates with API routes for data.

**Key directories:**

- `src/lib/db.ts` -- Storage layer. All data lives in a single JSON file (`data/db.json`). This is the only file that reads/writes to disk.
- `src/app/api/` -- REST API routes. Each route imports from `db.ts` and handles HTTP methods.
- `src/components/` -- React components. The main app is a single page (`src/app/page.tsx`) that manages state and renders the sidebar, editor, and modals.
- `src/hooks/useDocuments.ts` -- React hooks that wrap API calls for spaces, documents, search, and templates.

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npx jest --watch

# Run a specific test file
npx jest src/__tests__/db.test.ts
```

Tests are in `src/__tests__/` and use Jest with ts-jest. The test suite covers the database layer (seeding, CRUD, versioning, search, sharing, edge cases).

## Adding a New Feature

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes.** Follow existing patterns:
   - API routes go in `src/app/api/`
   - Components go in `src/components/`
   - Types go in `src/lib/types.ts`

3. **Write tests** for any new backend logic in `src/__tests__/`.

4. **Verify everything works:**
   ```bash
   npm test          # Tests pass
   npm run build     # Build succeeds (includes type checking)
   npm run lint      # No lint errors
   ```

5. **Commit and push:**
   ```bash
   git add -A
   git commit -m "feat: description of your change"
   git push -u origin feature/my-feature
   ```

6. **Open a PR** against `main`.

## Code Style

- TypeScript strict mode is enabled
- Use functional React components with hooks
- CSS uses TailwindCSS utility classes and CSS variables (defined in `globals.css`)
- No external state management library -- React `useState` and custom hooks are sufficient for this app

## Areas for Contribution

Here are some features and improvements that would be valuable:

### Storage Backends
The current JSON file storage works for single-user/small-team use. For production deployments:
- SQLite via `better-sqlite3` (requires Node 18+ with native compilation support)
- PostgreSQL adapter
- S3-backed storage for serverless deployments

### Dockerfile
A multi-stage Docker build would make deployment easier:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

### Other Ideas
- Real-time collaboration (WebSocket / CRDT)
- Document import (drag-and-drop .md files)
- Mermaid diagram rendering in preview
- Table of contents sidebar for long documents
- Breadcrumb navigation
- Document favorites / bookmarks
- Bulk export (download entire space as .zip)
- Authentication (NextAuth.js with GitHub OAuth)
- Comments / annotations on documents
