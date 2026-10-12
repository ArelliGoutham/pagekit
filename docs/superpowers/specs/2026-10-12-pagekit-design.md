# PageKit — Design Specification

**Date:** 2026-10-12  
**Status:** Design  
**Author:** PageKit Team

## Overview

PageKit is an open-source, self-hosted documentation and knowledge base platform. It combines MDX-based documentation (like Mintlify), API reference rendering (like Scalar), and flexible wiki pages (like Confluence) into a single modular offering.

The platform is designed for enterprises that need to self-host anywhere — any cloud, any infrastructure — with support for OIDC and LDAP authentication. It includes an admin portal for direct page editing with diff review and merge workflows, and is architecturally designed for AI-native features (RAG, writing assistant) to be added post-MVP.

## Architecture Decisions

### Framework: Next.js (App Router)

- **Why:** Best fit for a hybrid workload — static generation for content pages (ISR), client components for the admin portal's interactive features (split-panel editor, diff viewer)
- Single codebase handles both content consumption and content authoring
- Vercel AI SDK integrates natively for future AI features
- Largest ecosystem — most contributors will already know it

### Database: SQLite + Litestream

- **Why:** Zero-infra self-hosting. Single file database, no separate server process.
- WAL mode for concurrent reads (99.9% of workload is reads)
- FTS5 for built-in full-text search — no external search service needed
- sqlite-vec extension for vector embeddings (future AI RAG)
- Litestream for continuous replication to S3/MinIO — enterprise-grade durability
- Drizzle ORM for schema management and migrations

### Monorepo Structure: pnpm Workspaces + Turborepo

- **Why:** Clean separation of concerns while keeping a single deployable app
- One Next.js app (`apps/web/`) imports from focused packages (`packages/*`)
- Each package is independently testable and versioned
- Adding new modules (blog, API ref) = new packages + route groups, no touching existing code
- Turborepo for parallel builds and caching

### Admin Portal: Same App, /admin/* Routes

- Route-based separation — public at `/*`, admin at `/admin/*`
- Admin shell layout with shared top navigation
- Split-panel MDX editor (edit left, preview right, file tree sidebar)
- Auth middleware: public routes are open, `/admin/*` requires authenticated session

### MVP Scope

The MVP focuses on the core platform — the foundation everything else builds on:

1. Authentication (OIDC/LDAP via Auth.js)
2. Page CRUD with MDX content
3. Revision history and side-by-side diff viewer
4. Change batch workflow (draft → review → merge → live)
5. Navigation tree management (drag-and-drop)
6. Theme system with visual editor and live preview
7. Media upload for MDX content
8. User management and role-based access

### Deferred (Post-MVP)

- AI-powered search (RAG with sqlite-vec)
- AI writing assistant
- Documentation module (@pagekit/docs) — structured MDX docs
- API Reference module (@pagekit/api-ref) — OpenAPI rendering
- Wiki module (@pagekit/wiki) — rich-text wiki pages
- Blog module (@pagekit/blog) — internal company blogs
- Webhooks for CI/CD integration
- Analytics (privacy-first page views)
- Audit logging

## Data Model

### pages
```
id              TEXT PK (slug: "docs/getting-started")
title           TEXT
content         TEXT (raw MDX source)
content_type    TEXT ("mdx" | "openapi" | "rich-text")
status          TEXT ("draft" | "published" | "archived")
parent_id       TEXT FK → pages.id
sort_order      INTEGER
layout          TEXT ("docs" | "api-ref" | "wiki" | "blog")
frontmatter     TEXT (JSON)
created_by      TEXT FK → users.id
created_at      TEXT (ISO 8601)
updated_at      TEXT (ISO 8601)
```

### page_revisions
```
id              TEXT PK (UUID)
page_id         TEXT FK → pages.id
content         TEXT (full MDX snapshot)
title           TEXT
change_summary  TEXT
created_by      TEXT FK → users.id
created_at      TEXT
```

### navigation_trees
```
id              TEXT PK
name            TEXT
context         TEXT ("docs" | "api-ref" | "wiki")
created_at      TEXT
```

### navigation_nodes
```
id              TEXT PK
tree_id         TEXT FK → navigation_trees.id
page_id         TEXT FK → pages.id (nullable for folders)
parent_node_id  TEXT FK → navigation_nodes.id
label           TEXT
type            TEXT ("page" | "folder" | "divider" | "link")
sort_order      INTEGER
icon            TEXT
```

### users
```
id              TEXT PK
email           TEXT UNIQUE
name            TEXT
avatar_url      TEXT
provider        TEXT ("oidc" | "ldap" | "local")
provider_id     TEXT
role            TEXT ("admin" | "editor" | "viewer")
created_at      TEXT
last_login_at   TEXT
```

### sessions
```
id              TEXT PK
user_id         TEXT FK → users.id
expires_at      TEXT
created_at      TEXT
```

### auth_providers
```
id              TEXT PK
type            TEXT ("oidc" | "ldap" | "saml")
name            TEXT
config          TEXT (JSON: issuer, client_id, endpoints)
enabled         BOOLEAN
created_at      TEXT
```

### change_batches
```
id              TEXT PK
title           TEXT
description     TEXT
status          TEXT ("draft" | "in_review" | "merged")
created_by      TEXT FK → users.id
created_at      TEXT
merged_at       TEXT
merged_by       TEXT FK → users.id
```

### change_batch_revisions
```
batch_id        TEXT FK → change_batches.id
revision_id     TEXT FK → page_revisions.id
```

### themes
```
id              TEXT PK
name            TEXT
is_builtin      BOOLEAN
variables       TEXT (JSON: CSS custom properties)
config          TEXT (JSON: fonts, logo, nav style)
created_by      TEXT FK → users.id
created_at      TEXT
updated_at      TEXT
```

## Package Structure

```
pagekit/
├── apps/
│   └── web/              ← Next.js App Router (public + admin)
├── packages/
│   ├── core/             ← Shared types, utilities, config
│   ├── auth/             ← OIDC/LDAP auth (Auth.js providers)
│   ├── db/               ← Drizzle ORM schema + migrations
│   ├── mdx/              ← MDX compilation, plugins, syntax highlighting
│   ├── themes/           ← Theme engine, built-in themes, CSS var generation
│   ├── search/           ← FTS5 search (→ AI RAG later)
│   ├── ui/               ← Shared UI components (shadcn/ui + Tailwind)
│   └── admin/            ← Admin portal components (editor, diff viewer, etc.)
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── Dockerfile
```

## Route Structure

### Public Routes (no auth required)
```
/                           → Landing page
/search                     → Global search
/docs/[...slug]             → MDX documentation (future)
/api-ref/[...slug]          → API reference (future)
/wiki/[...slug]             → Wiki pages (future)
/blog                       → Blog listing (future)
/blog/[slug]                → Blog posts (future)
/api/auth/[...nextauth]     → Auth.js handlers
/api/revalidate             → ISR revalidation webhook
```

### Admin Routes (auth required)
```
/admin                      → Dashboard
/admin/pages                → Page list
/admin/pages/[pageId]/edit  → Split-panel MDX editor
/admin/pages/[pageId]/history → Revision history
/admin/navigation           → Drag-and-drop sidebar tree builder
/admin/batches              → Change batch list
/admin/batches/[batchId]    → Batch diff review
/admin/themes               → Theme list
/admin/themes/[themeId]     → Visual theme editor
/admin/settings             → General settings
/admin/settings/auth        → Auth provider configuration
/admin/users                → User management
/admin/media                → Media library
```

## Content Change Workflow

1. **Edit** — Author edits page in split-panel MDX editor (admin portal)
2. **Save Draft** — Creates a new `page_revision` with status "draft"
3. **Create Batch** — Optionally groups multiple page edits into a `change_batch`
4. **Review Diff** — Side-by-side or unified diff view between any two revisions
5. **Merge** — When batch is approved, revisions become the "main" page versions
6. **Publish** — `revalidateTag(page_id)` triggers ISR, changes go live within seconds
7. **Rollback** — Any previous revision can be restored (always recoverable)

### Diff Viewer
- **Side-by-side:** Two-column comparison (published vs draft)
- **Unified:** Single-column with inline +/- markers
- Powered by a JS diff library (e.g., `diff` package) — computed client-side between revision snapshots

## Theme System

- CSS custom properties stored as JSON in the `themes` table
- Tailwind reads CSS vars at build time (`colors.primary: var(--color-primary)`)
- Built-in themes: Light, Dark, and a few professional variants
- Custom themes created via the admin theme editor
- Theme editor has live preview panel showing changes in real-time
- Theme switching is instant — change CSS vars on `<html>`, no rebuild needed
- Per-deployment theme: each PageKit instance uses one active theme


## Authentication

- Auth.js (NextAuth v5) with OIDC and LDAP providers
- Multiple providers can be configured simultaneously
- Provider configuration stored in `auth_providers` table
- Roles: admin (full access), editor (create/edit pages), viewer (read-only admin)
- Next.js middleware protects `/admin/*` routes — unauthenticated users redirected to sign-in
- Session-based auth with database-backed sessions

## Deployment

### Docker (Recommended)
Single container with SQLite inside, Litestream sidecar for replication.
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

### Kubernetes
Helm chart with persistent volume for SQLite, Litestream → S3/MinIO. ReadWriteOnce (single writer — appropriate for docs workload).

### Bare Metal / VPS
`npx pagekit start` — Node.js process, managed via systemd. SQLite file on disk.

### Cloud Platforms
Railway, Fly.io, Render, DigitalOcean App Platform, AWS ECS, GCP Cloud Run — any Node.js host.

### Environment Variables
```
DATABASE_PATH=/data/pagekit.db
AUTH_SECRET=...
AUTH_OIDC_ISSUER=...
AUTH_OIDC_CLIENT_ID=...
AUTH_OIDC_CLIENT_SECRET=...
LITESTREAM_S3_ENDPOINT=...
LITESTREAM_S3_BUCKET=...
PUBLIC_SITE_URL=https://docs.example.com
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | SQLite (WAL mode) + Drizzle ORM |
| Replication | Litestream → S3/MinIO |
| Auth | Auth.js (NextAuth v5) |
| Styling | Tailwind CSS + shadcn/ui |
| MDX | @next/mdx + custom plugins |
| Build | Turborepo + pnpm workspaces |
| Search | SQLite FTS5 (→ sqlite-vec for AI) |
| Diff | `diff` package (client-side) |
| Container | Docker (single container) |

## Future: AI Integration (Post-MVP)

Planned AI capabilities (architecture designed for, implementation deferred):

### AI-Assisted Search (RAG)
- sqlite-vec extension for vector embeddings
- Embed pages on publish/update
- Semantic search: users ask questions, get answers with citations from docs
- Streaming response via Vercel AI SDK

### AI Writing Assistant
- Suggest improvements while editing in admin portal
- Grammar fixes, tone adjustments, readability scoring
- Auto-generate page descriptions and metadata

### Architecture Readiness
- `page_embeddings` table ready (vectors stored via sqlite-vec)
- API route handlers designed for streaming responses
- Admin editor has hooks for AI suggestions panel