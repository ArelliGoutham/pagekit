# PageKit MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the PageKit core platform — a self-hosted, MDX-based documentation platform with auth, page CRUD, revision history, diff viewer, change batches, navigation management, themes, and an admin portal.

**Architecture:** Monorepo with a single Next.js App Router app (`apps/web`) importing from focused packages (`packages/*`). SQLite database via Drizzle ORM. Auth.js for OIDC/LDAP authentication. shadcn/ui + Tailwind for the admin portal UI. ISR for public pages, client-side diff for revisions.

**Tech Stack:** Next.js 15, TypeScript, SQLite (WAL), Drizzle ORM, Auth.js v5, Tailwind CSS, shadcn/ui, pnpm, Turborepo

---

## Phase 1: Monorepo Scaffolding

### Task 1: Initialize monorepo with pnpm workspaces and Turborepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.npmrc`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "pagekit",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "prettier": "^3.4.0",
    "typescript": "^5.6.0"
  },
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

- [ ] **Step 4: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 5: Create .npmrc**

```
auto-install-peers=true
strict-peer-dependencies=false
```

- [ ] **Step 6: Update .gitignore to include monorepo ignores**

```
node_modules/
.next/
dist/
.turbo/
*.db
*.db-journal
*.db-wal
*.db-shm
.superpowers/
.env
.env.local
.env.*.local
coverage/
```

- [ ] **Step 7: Install root dependencies and verify**

Run: `pnpm install`
Expected: Success with no errors

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .npmrc .gitignore
git commit -m "chore: initialize monorepo with pnpm, TypeScript, and Turborepo"
```

---

### Task 2: Scaffold packages/core

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/src/types.ts`

- [ ] **Step 1: Create packages/core/package.json**

```json
{
  "name": "@pagekit/core",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "tsc --noEmit",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create packages/core/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create packages/core/src/types.ts**

```typescript
export interface Page {
  id: string;
  title: string;
  content: string;
  contentType: "mdx" | "openapi" | "rich-text";
  status: "draft" | "published" | "archived";
  parentId: string | null;
  sortOrder: number;
  layout: "docs" | "api-ref" | "wiki" | "blog";
  frontmatter: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageRevision {
  id: string;
  pageId: string;
  content: string;
  title: string;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  provider: "oidc" | "ldap" | "local";
  providerId: string;
  role: "admin" | "editor" | "viewer";
  createdAt: string;
  lastLoginAt: string | null;
}

export interface NavigationTree {
  id: string;
  name: string;
  context: "docs" | "api-ref" | "wiki";
  createdAt: string;
}

export interface NavigationNode {
  id: string;
  treeId: string;
  pageId: string | null;
  parentNodeId: string | null;
  label: string;
  type: "page" | "folder" | "divider" | "link";
  sortOrder: number;
  icon: string | null;
}

export interface ChangeBatch {
  id: string;
  title: string;
  description: string;
  status: "draft" | "in_review" | "merged";
  createdBy: string;
  createdAt: string;
  mergedAt: string | null;
  mergedBy: string | null;
}

export interface Theme {
  id: string;
  name: string;
  isBuiltin: boolean;
  variables: Record<string, string>;
  config: ThemeConfig;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeConfig {
  logo?: string;
  favicon?: string;
  navStyle?: "sidebar" | "header";
  searchPosition?: "header" | "sidebar";
}

export interface AuthProvider {
  id: string;
  type: "oidc" | "ldap" | "saml";
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
}
```

- [ ] **Step 4: Create packages/core/src/index.ts**

```typescript
export * from "./types";
```

- [ ] **Step 5: Install and verify**

Run: `pnpm install`
Expected: Success

- [ ] **Step 6: Commit**

```bash
git add packages/core/
git commit -m "feat: scaffold @pagekit/core with shared types"
```

---

### Task 3: Scaffold packages/db with Drizzle ORM

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/drizzle.config.ts`

- [ ] **Step 1: Create packages/db/package.json**

```json
{
  "name": "@pagekit/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "lint": "tsc --noEmit",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@pagekit/core": "workspace:*",
    "drizzle-orm": "^0.36.0",
    "better-sqlite3": "^11.6.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "drizzle-kit": "^0.28.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create packages/db/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create packages/db/src/schema.ts** with full Drizzle schema

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  provider: text("provider", { enum: ["oidc", "ldap", "local"] }).notNull(),
  providerId: text("provider_id").notNull(),
  role: text("role", { enum: ["admin", "editor", "viewer"] })
    .notNull()
    .default("viewer"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  lastLoginAt: text("last_login_at"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const authProviders = sqliteTable("auth_providers", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["oidc", "ldap", "saml"] }).notNull(),
  name: text("name").notNull(),
  config: text("config", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const pages = sqliteTable("pages", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  contentType: text("content_type", {
    enum: ["mdx", "openapi", "rich-text"],
  })
    .notNull()
    .default("mdx"),
  status: text("status", { enum: ["draft", "published", "archived"] })
    .notNull()
    .default("draft"),
  parentId: text("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  layout: text("layout", { enum: ["docs", "api-ref", "wiki", "blog"] })
    .notNull()
    .default("docs"),
  frontmatter: text("frontmatter", { mode: "json" })
    .notNull()
    .$type<Record<string, unknown>>()
    .default({}),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const pageRevisions = sqliteTable("page_revisions", {
  id: text("id").primaryKey(),
  pageId: text("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  title: text("title").notNull(),
  changeSummary: text("change_summary").notNull().default(""),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const navigationTrees = sqliteTable("navigation_trees", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  context: text("context", { enum: ["docs", "api-ref", "wiki"] }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const navigationNodes = sqliteTable("navigation_nodes", {
  id: text("id").primaryKey(),
  treeId: text("tree_id")
    .notNull()
    .references(() => navigationTrees.id, { onDelete: "cascade" }),
  pageId: text("page_id").references(() => pages.id, { onDelete: "cascade" }),
  parentNodeId: text("parent_node_id"),
  label: text("label").notNull(),
  type: text("type", {
    enum: ["page", "folder", "divider", "link"],
  }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  icon: text("icon"),
});

export const changeBatches = sqliteTable("change_batches", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status", { enum: ["draft", "in_review", "merged"] })
    .notNull()
    .default("draft"),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  mergedAt: text("merged_at"),
  mergedBy: text("merged_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

export const changeBatchRevisions = sqliteTable("change_batch_revisions", {
  batchId: text("batch_id")
    .notNull()
    .references(() => changeBatches.id, { onDelete: "cascade" }),
  revisionId: text("revision_id")
    .notNull()
    .references(() => pageRevisions.id, { onDelete: "cascade" }),
});

export const themes = sqliteTable("themes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isBuiltin: integer("is_builtin", { mode: "boolean" }).notNull().default(false),
  variables: text("variables", { mode: "json" })
    .notNull()
    .$type<Record<string, string>>()
    .default({}),
  config: text("config", { mode: "json" })
    .notNull()
    .$type<Record<string, unknown>>()
    .default({}),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
```

- [ ] **Step 4: Create packages/db/src/client.ts**

```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle> | null = null;

export function getDb(databasePath?: string) {
  if (db) return db;

  const path = databasePath || process.env.DATABASE_PATH || "./pagekit.db";
  const sqlite = new Database(path);

  // Enable WAL mode for concurrent reads
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  db = drizzle(sqlite, { schema });
  return db;
}

export function getSqliteDb(databasePath?: string) {
  const path = databasePath || process.env.DATABASE_PATH || "./pagekit.db";
  return new Database(path);
}

export * from "./schema";
```

- [ ] **Step 5: Create packages/db/src/index.ts**

```typescript
export { getDb, getSqliteDb } from "./client";
export * from "./schema";
```

- [ ] **Step 6: Create packages/db/drizzle.config.ts**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_PATH || "./pagekit.db",
  },
});
```

- [ ] **Step 7: Install dependencies and verify**

Run: `pnpm install`
Expected: Success

- [ ] **Step 8: Commit**

```bash
git add packages/db/
git commit -m "feat: scaffold @pagekit/db with Drizzle schema for all MVP tables"
```

---

## Phase 2: Next.js App Scaffolding

### Task 4: Scaffold apps/web Next.js application

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`

- [ ] **Step 1: Create apps/web/package.json**

```json
{
  "name": "@pagekit/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@pagekit/core": "workspace:*",
    "@pagekit/db": "workspace:*",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create apps/web/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create apps/web/next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create apps/web/tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/admin/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 5: Create apps/web/postcss.config.mjs**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

- [ ] **Step 6: Create apps/web/src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Create apps/web/src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PageKit",
  description: "Open-source documentation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create apps/web/src/app/page.tsx**

```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">PageKit</h1>
    </main>
  );
}
```

- [ ] **Step 9: Install dependencies and verify dev server starts**

Run: `pnpm install && pnpm dev`
Expected: Next.js dev server starts on port 3000. Visit `http://localhost:3000` — see "PageKit" heading.

- [ ] **Step 10: Stop dev server and commit**

```bash
git add apps/web/
git commit -m "feat: scaffold Next.js app with Tailwind CSS"
```
---

## Phase 3: shadcn/ui Setup

### Task 5: Initialize shadcn/ui and add base components

**Files:**
- Create: `apps/web/components.json`
- Create: `apps/web/src/lib/utils.ts`

- [ ] **Step 1: Initialize shadcn/ui**

Run: `cd apps/web && npx shadcn@latest init -d`
Expected: Creates `components.json` and `src/lib/utils.ts`

- [ ] **Step 2: Add key UI components**

Run from `apps/web/`:
```bash
npx shadcn@latest add button input card dialog dropdown-menu table tabs textarea select separator scroll-area sheet badge
```
Expected: All components added to `apps/web/src/components/ui/`

- [ ] **Step 3: Verify build still works**

Run: `pnpm run build` (from root)
Expected: Successful build

- [ ] **Step 4: Commit**

```bash
git add apps/web/
git commit -m "feat: add shadcn/ui with base component set"
```

---

## Phase 4: Authentication

### Task 6: Set up Auth.js with database adapter

**Files:**
- Create: `apps/web/src/lib/auth.ts`
- Create: `apps/web/src/lib/auth/config.ts`
- Create: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/web/src/middleware.ts`
- Create: `apps/web/.env.local`

- [ ] **Step 1: Install Auth.js packages**

Run: `cd apps/web && pnpm add next-auth@beta @auth/core @auth/drizzle-adapter`
Expected: Packages installed

- [ ] **Step 2: Create apps/web/src/lib/auth/config.ts**

```typescript
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isLoginPage = nextUrl.pathname === "/admin/login";

      if (isAdminRoute) {
        if (isLoginPage) {
          if (isLoggedIn) {
            return Response.redirect(new URL("/admin", nextUrl));
          }
          return true;
        }
        return isLoggedIn;
      }

      if (isAuthRoute) return true;
      return true;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [],
};
```

- [ ] **Step 3: Create apps/web/src/lib/auth.ts**

```typescript
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@pagekit/db";
import { authConfig } from "./auth/config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(getDb()),
  session: { strategy: "jwt" },
});
```

- [ ] **Step 4: Create apps/web/src/app/api/auth/[...nextauth]/route.ts**

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 5: Create apps/web/src/middleware.ts**

```typescript
import { authConfig } from "@/lib/auth/config";
import NextAuth from "next-auth";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 6: Create apps/web/.env.local**

```
AUTH_SECRET=dev-secret-change-in-production-do-not-commit
DATABASE_PATH=./pagekit.db
```

- [ ] **Step 7: Verify dev server starts without errors**

Run: `pnpm dev`
Expected: No errors. Visit `http://localhost:3000/admin/login` — see login page.

- [ ] **Step 8: Commit**

```bash
git add apps/web/
git commit -m "feat: set up Auth.js with database adapter and middleware"
```

---

### Task 7: Create admin login page

**Files:**
- Create: `apps/web/src/app/admin/login/page.tsx`
- Create: `apps/web/src/app/admin/login/login-form.tsx`

- [ ] **Step 1: Create apps/web/src/app/admin/login/login-form.tsx**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, callbackUrl: "/admin" }),
    });
    if (res.ok) window.location.href = "/admin";
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in to PageKit</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/admin/login/page.tsx**

```tsx
import { LoginForm } from "./login-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <LoginForm />
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/admin/login/
git commit -m "feat: add admin login page with credentials auth"
```

---

### Task 8: Scaffold admin layout shell

**Files:**
- Create: `apps/web/src/app/admin/layout.tsx`
- Create: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/app/admin/admin-nav.tsx`

- [ ] **Step 1: Create apps/web/src/app/admin/admin-nav.tsx**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/navigation", label: "Navigation" },
  { href: "/admin/batches", label: "Batches" },
  { href: "/admin/themes", label: "Themes" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/media", label: "Media" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-bold text-lg">
            📄 PageKit
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Button variant="outline" size="sm" onClick={() => signOut()}>
          Sign Out
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/admin/layout.tsx**

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create apps/web/src/app/admin/page.tsx**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function AdminDashboard() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Welcome, {session?.user?.name || "Admin"}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify admin routes are protected**

Run: `pnpm dev`, visit `http://localhost:3000/admin`
Expected: Redirected to `/admin/login`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/admin/
git commit -m "feat: add admin layout shell with navigation and dashboard"
```

---

## Phase 5: Page CRUD

### Task 9: Create API route for page CRUD

**Files:**
- Create: `apps/web/src/app/api/pages/route.ts`
- Create: `apps/web/src/app/api/pages/[pageId]/route.ts`
- Create: `apps/web/src/lib/pages.ts`

- [ ] **Step 1: Install uuid**

Run: `cd apps/web && pnpm add uuid && pnpm add -D @types/uuid`
Expected: Installed

- [ ] **Step 2: Create apps/web/src/lib/pages.ts**

```typescript
import { getDb, pages, pageRevisions } from "@pagekit/db";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export type CreatePageInput = {
  id: string;
  title: string;
  content?: string;
  parentId?: string | null;
  createdBy: string;
};

export type UpdatePageInput = {
  title?: string;
  content?: string;
  status?: "draft" | "published" | "archived";
  parentId?: string | null;
  sortOrder?: number;
  frontmatter?: Record<string, unknown>;
};

export async function getPages() {
  const db = getDb();
  return db.select().from(pages).orderBy(desc(pages.updatedAt));
}

export async function getPageById(pageId: string) {
  const db = getDb();
  const result = db
    .select()
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1)
    .all();
  return result[0] ?? null;
}

export async function createPage(input: CreatePageInput) {
  const db = getDb();
  const page = {
    id: input.id,
    title: input.title,
    content: input.content || "",
    parentId: input.parentId || null,
    createdBy: input.createdBy,
    status: "draft" as const,
    contentType: "mdx" as const,
    layout: "docs" as const,
    frontmatter: {},
  };
  db.insert(pages).values(page).run();
  return page;
}

export async function updatePage(pageId: string, input: UpdatePageInput) {
  const db = getDb();
  const existing = getPageById(pageId);
  if (!existing) return null;

  db.update(pages).set(input).where(eq(pages.id, pageId)).run();
  return getPageById(pageId);
}

export async function deletePage(pageId: string) {
  const db = getDb();
  db.delete(pages).where(eq(pages.id, pageId)).run();
}

export async function getPageRevisions(pageId: string) {
  const db = getDb();
  return db
    .select()
    .from(pageRevisions)
    .where(eq(pageRevisions.pageId, pageId))
    .orderBy(desc(pageRevisions.createdAt))
    .all();
}

export async function createPageRevision(input: {
  pageId: string;
  content: string;
  title: string;
  changeSummary: string;
  createdBy: string;
}) {
  const db = getDb();
  const revision = {
    id: uuidv4(),
    pageId: input.pageId,
    content: input.content,
    title: input.title,
    changeSummary: input.changeSummary,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  db.insert(pageRevisions).values(revision).run();
  return revision;
}
```

- [ ] **Step 3: Create apps/web/src/app/api/pages/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPages, createPage } from "@/lib/pages";

export async function GET() {
  const pages = await getPages();
  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const page = await createPage({
    id: body.id,
    title: body.title,
    content: body.content,
    parentId: body.parentId,
    createdBy: session.user.id,
  });

  return NextResponse.json(page, { status: 201 });
}
```

- [ ] **Step 4: Create apps/web/src/app/api/pages/[pageId]/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getPageById,
  updatePage,
  deletePage,
  createPageRevision,
} from "@/lib/pages";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const page = await getPageById(pageId);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pageId } = await params;
  const body = await req.json();

  // Create revision if content changed
  if (body.content) {
    const existing = await getPageById(pageId);
    if (existing) {
      await createPageRevision({
        pageId,
        content: existing.content,
        title: existing.title,
        changeSummary: body.changeSummary || "",
        createdBy: session.user.id,
      });
    }
  }

  const page = await updatePage(pageId, body);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pageId } = await params;
  await deletePage(pageId);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/pages.ts apps/web/src/app/api/pages/
git commit -m "feat: add page CRUD API with revision tracking"
```

---

### Task 10: Create pages list view in admin

**Files:**
- Create: `apps/web/src/app/admin/pages/page.tsx`
- Create: `apps/web/src/app/admin/pages/pages-table.tsx`

- [ ] **Step 1: Create apps/web/src/app/admin/pages/pages-table.tsx**

```tsx
"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Page {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  layout: string;
}

export function PagesTable({ pages }: { pages: Page[] }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">All Pages ({pages.length})</h2>
        <Link href="/admin/pages/new">
          <Button>New Page</Button>
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Layout</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page.id}>
              <TableCell className="font-medium">{page.title}</TableCell>
              <TableCell className="font-mono text-sm text-gray-500">
                /{page.id}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    page.status === "published" ? "default" : "secondary"
                  }
                >
                  {page.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {page.layout}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {new Date(page.updatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="flex gap-2">
                <Link href={`/admin/pages/${page.id}/edit`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <Link href={`/admin/pages/${page.id}/history`}>
                  <Button variant="outline" size="sm">History</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/admin/pages/page.tsx**

```tsx
import { getPages } from "@/lib/pages";
import { PagesTable } from "./pages-table";

export default async function AdminPagesPage() {
  const pages = await getPages();
  return <PagesTable pages={pages} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/admin/pages/
git commit -m "feat: add admin pages list view with table"
```

---

## Phase 6: Split-Panel MDX Editor

### Task 11: Install MDX packages

Run:
```bash
cd apps/web
pnpm add @mdx-js/mdx @mdx-js/react rehype-highlight rehype-slug rehype-autolink-headings
```

- [ ] **Step 1: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "feat: add MDX processing packages"
```

---

### Task 12: Create split-panel editor page

**Files:**
- Create: `apps/web/src/app/admin/pages/[pageId]/edit/page.tsx`
- Create: `apps/web/src/app/admin/pages/[pageId]/edit/editor-client.tsx`
- Create: `apps/web/src/lib/mdx.ts`
- Create: `apps/web/src/app/api/mdx/compile/route.ts`

- [ ] **Step 1: Create apps/web/src/lib/mdx.ts**

```typescript
import { compile } from "@mdx-js/mdx";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export async function compileMdx(source: string) {
  const result = await compile(source, {
    outputFormat: "function-body",
    rehypePlugins: [rehypeHighlight, rehypeSlug, rehypeAutolinkHeadings],
    development: false,
  });
  return String(result.value);
}
```

- [ ] **Step 2: Create apps/web/src/app/api/mdx/compile/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { compileMdx } from "@/lib/mdx";

export async function POST(req: NextRequest) {
  const { source } = await req.json();
  try {
    const compiled = await compileMdx(source);
    return NextResponse.json({ compiled });
  } catch (error) {
    return NextResponse.json(
      { error: "MDX compilation failed" },
      { status: 400 }
    );
  }
}
```

- [ ] **Step 3: Create apps/web/src/app/admin/pages/[pageId]/edit/editor-client.tsx**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function SplitPanelEditor({ pageId }: { pageId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [compiledOutput, setCompiledOutput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pages/${pageId}`)
      .then((r) => r.json())
      .then((page) => {
        if (page.title) setTitle(page.title);
        if (page.content) setContent(page.content);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pageId]);

  const updatePreview = useCallback(async (source: string) => {
    if (!source.trim()) {
      setCompiledOutput("");
      return;
    }
    try {
      const res = await fetch("/api/mdx/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      const { compiled } = await res.json();
      if (compiled) setCompiledOutput(compiled);
    } catch {
      // ignore preview errors
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => updatePreview(content), 500);
    return () => clearTimeout(timer);
  }, [content, updatePreview]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, changeSummary }),
    });
    setSaving(false);
    router.refresh();
  }

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4 gap-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title"
          className="text-xl font-bold w-96"
        />
        <div className="flex items-center gap-2">
          <Input
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="What changed?"
            className="w-64 text-sm"
          />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Draft"}
          </Button>
        </div>
      </div>
      <div className="flex flex-1 gap-0 border rounded-lg overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b uppercase">
            Editor
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Start writing MDX..."
            className="flex-1 border-0 rounded-none resize-none font-mono text-sm p-4 focus-visible:ring-0"
          />
        </div>
        <div className="w-px bg-gray-200" />
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b uppercase">
            Preview
          </div>
          <Card className="flex-1 border-0 rounded-none overflow-auto p-4">
            {compiledOutput ? (
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {compiledOutput}
              </pre>
            ) : (
              <p className="text-gray-400 text-sm">
                Start typing to see compiled MDX output...
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/src/app/admin/pages/[pageId]/edit/page.tsx**

```tsx
import { SplitPanelEditor } from "./editor-client";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  return <SplitPanelEditor pageId={pageId} />;
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/admin/pages/ apps/web/src/lib/mdx.ts apps/web/src/app/api/mdx/
git commit -m "feat: add split-panel MDX editor with live preview"
```

---

## Phase 7: Diff Viewer & Revisions

### Task 13: Install diff package

Run:
```bash
cd apps/web && pnpm add diff && pnpm add -D @types/diff
```

- [ ] **Step 1: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore: add diff package for revision comparison"
```

---

### Task 14: Create revision history page with diff viewer

**Files:**
- Create: `apps/web/src/app/admin/pages/[pageId]/history/page.tsx`
- Create: `apps/web/src/app/admin/pages/[pageId]/history/diff-client.tsx`
- Create: `apps/web/src/app/admin/pages/[pageId]/history/revision-list.tsx`
- Create: `apps/web/src/app/admin/pages/[pageId]/history/diff-viewer.tsx`

- [ ] **Step 1: Create apps/web/src/app/admin/pages/[pageId]/history/diff-viewer.tsx**

```tsx
"use client";

import { diffLines, Change } from "diff";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Revision {
  id: string;
  content: string;
  title: string;
  changeSummary: string;
  createdAt: string;
}

export function DiffViewer({
  revisions,
  currentContent,
  selectedId,
}: {
  revisions: Revision[];
  currentContent: string;
  selectedId: string | null;
}) {
  const [mode, setMode] = useState<"side-by-side" | "unified">("unified");

  const selectedRevision = revisions.find((r) => r.id === selectedId);
  let changes: Change[] = [];

  if (selectedRevision) {
    changes = diffLines(selectedRevision.content, currentContent);
  }

  if (!selectedRevision) {
    return <p className="text-gray-500">Select a revision to compare.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Diff View</h3>
        <div className="flex gap-2">
          <Button
            variant={mode === "unified" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("unified")}
          >
            Unified
          </Button>
          <Button
            variant={mode === "side-by-side" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("side-by-side")}
          >
            Side by Side
          </Button>
        </div>
      </div>

      {mode === "unified" && (
        <div className="border rounded-lg overflow-hidden font-mono text-sm">
          <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">
            {selectedRevision.changeSummary || "Revision"} → Current Draft
          </div>
          <div className="p-4 max-h-96 overflow-auto">
            {changes.map((change, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap ${
                  change.added
                    ? "bg-green-50 text-green-800"
                    : change.removed
                    ? "bg-red-50 text-red-800"
                    : "text-gray-700"
                }`}
              >
                {change.added ? "+ " : change.removed ? "- " : "  "}
                {change.value}
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "side-by-side" && (
        <div className="grid grid-cols-2 border rounded-lg overflow-hidden font-mono text-sm">
          <div className="border-r">
            <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">
              {selectedRevision.changeSummary || "Revision"}
            </div>
            <div className="p-4 max-h-96 overflow-auto">
              {changes.map((change, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap ${
                    change.removed
                      ? "bg-red-50 text-red-800"
                      : change.added
                      ? "hidden"
                      : "text-gray-700"
                  }`}
                >
                  {change.value}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">
              Current Draft
            </div>
            <div className="p-4 max-h-96 overflow-auto">
              {changes.map((change, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap ${
                    change.added
                      ? "bg-green-50 text-green-800"
                      : change.removed
                      ? "hidden"
                      : "text-gray-700"
                  }`}
                >
                  {change.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/admin/pages/[pageId]/history/revision-list.tsx**

```tsx
"use client";

interface Revision {
  id: string;
  changeSummary: string;
  createdAt: string;
}

export function RevisionList({
  revisions,
  selectedId,
  onSelect,
}: {
  revisions: Revision[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {revisions.map((rev) => (
        <button
          key={rev.id}
          onClick={() => onSelect(rev.id)}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            selectedId === rev.id
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <p className="font-medium text-sm">
            {rev.changeSummary || "No description"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(rev.createdAt).toLocaleString()}
          </p>
        </button>
      ))}
      {revisions.length === 0 && (
        <p className="text-sm text-gray-400">No revisions yet.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create apps/web/src/app/admin/pages/[pageId]/history/diff-client.tsx**

```tsx
"use client";

import { useState } from "react";
import { RevisionList } from "./revision-list";
import { DiffViewer } from "./diff-viewer";

interface Page {
  id: string;
  content: string;
}

interface Revision {
  id: string;
  content: string;
  title: string;
  changeSummary: string;
  createdAt: string;
}

export function DiffClient({
  page,
  revisions,
}: {
  page: Page;
  revisions: Revision[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-3 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Revisions ({revisions.length})
        </h3>
        <RevisionList
          revisions={revisions}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
      <div className="col-span-2">
        <DiffViewer
          revisions={revisions}
          currentContent={page.content}
          selectedId={selectedId}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/src/app/admin/pages/[pageId]/history/page.tsx**

```tsx
import { getPageById, getPageRevisions } from "@/lib/pages";
import { DiffClient } from "./diff-client";

export default async function PageHistoryPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const page = await getPageById(pageId);
  const revisions = await getPageRevisions(pageId);

  if (!page) return <p>Page not found.</p>;

  return <DiffClient page={page} revisions={revisions} />;
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/admin/pages/
git commit -m "feat: add revision history with side-by-side and unified diff viewer"
```

---

## Phase 8: Navigation Management

### Task 15: Create navigation API and admin page

**Files:**
- Create: `apps/web/src/app/api/navigation/trees/route.ts`
- Create: `apps/web/src/app/api/navigation/trees/[treeId]/nodes/route.ts`
- Create: `apps/web/src/app/admin/navigation/page.tsx`
- Create: `apps/web/src/app/admin/navigation/navigation-client.tsx`

- [ ] **Step 1: Create apps/web/src/app/api/navigation/trees/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, navigationTrees } from "@pagekit/db";

export async function GET() {
  const db = getDb();
  const trees = db.select().from(navigationTrees).all();
  return NextResponse.json(trees);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const db = getDb();
  db.insert(navigationTrees).values({
    id: body.id,
    name: body.name,
    context: body.context || "docs",
  }).run();

  return NextResponse.json({ success: true }, { status: 201 });
}
```

- [ ] **Step 2: Create apps/web/src/app/api/navigation/trees/[treeId]/nodes/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, navigationNodes } from "@pagekit/db";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ treeId: string }> }
) {
  const { treeId } = await params;
  const db = getDb();
  const nodes = db
    .select()
    .from(navigationNodes)
    .where(eq(navigationNodes.treeId, treeId))
    .all();
  return NextResponse.json(nodes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ treeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { treeId } = await params;
  const body = await req.json();
  const db = getDb();

  db.insert(navigationNodes).values({
    id: body.id,
    treeId,
    pageId: body.pageId || null,
    parentNodeId: body.parentNodeId || null,
    label: body.label,
    type: body.type || "page",
    sortOrder: body.sortOrder || 0,
    icon: body.icon || null,
  }).run();

  return NextResponse.json({ success: true }, { status: 201 });
}
```

- [ ] **Step 3: Create apps/web/src/app/admin/navigation/navigation-client.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TreeNode {
  id: string;
  label: string;
  type: string;
  pageId: string | null;
  sortOrder: number;
}

export function NavigationClient() {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/navigation/trees/main-docs/nodes")
      .then((r) => r.json())
      .then(setNodes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Navigation</h1>
        <Button>Add Node</Button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            {nodes.length} navigation items.
          </p>
          {nodes
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((node) => (
              <div
                key={node.id}
                className="flex items-center gap-4 py-2 px-4 border rounded-lg mb-2"
              >
                <span className="text-sm text-gray-400">☰</span>
                <span className="flex-1 font-medium">{node.label}</span>
                <span className="text-xs text-gray-400 uppercase">
                  {node.type}
                </span>
                {node.pageId && (
                  <span className="text-xs font-mono text-gray-400">
                    → {node.pageId}
                  </span>
                )}
              </div>
            ))}
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/src/app/admin/navigation/page.tsx**

```tsx
import { NavigationClient } from "./navigation-client";

export default function AdminNavigationPage() {
  return <NavigationClient />;
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/navigation/ apps/web/src/app/admin/navigation/
git commit -m "feat: add navigation tree management API and admin page"
```

---

## Phase 9: Change Batches

### Task 16: Create change batch API and admin page

**Files:**
- Create: `apps/web/src/app/api/batches/route.ts`
- Create: `apps/web/src/app/api/batches/[batchId]/route.ts`
- Create: `apps/web/src/app/admin/batches/page.tsx`
- Create: `apps/web/src/app/admin/batches/batches-client.tsx`

- [ ] **Step 1: Create apps/web/src/app/api/batches/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, changeBatches, changeBatchRevisions } from "@pagekit/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const db = getDb();
  const batches = db.select().from(changeBatches).all();
  return NextResponse.json(batches);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const batchId = uuidv4();
  const db = getDb();

  db.insert(changeBatches).values({
    id: batchId,
    title: body.title,
    description: body.description || "",
    createdBy: session.user.id,
    status: "draft",
  }).run();

  if (body.revisionIds && Array.isArray(body.revisionIds)) {
    for (const revisionId of body.revisionIds) {
      db.insert(changeBatchRevisions).values({
        batchId,
        revisionId,
      }).run();
    }
  }

  return NextResponse.json({ id: batchId }, { status: 201 });
}
```

- [ ] **Step 2: Create apps/web/src/app/api/batches/[batchId]/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, changeBatches, changeBatchRevisions } from "@pagekit/db";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
  const db = getDb();
  const batch = db
    .select()
    .from(changeBatches)
    .where(eq(changeBatches.id, batchId))
    .limit(1)
    .all();

  if (!batch[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const revisionLinks = db
    .select()
    .from(changeBatchRevisions)
    .where(eq(changeBatchRevisions.batchId, batchId))
    .all();

  return NextResponse.json({ ...batch[0], revisionLinks });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { batchId } = await params;
  const body = await req.json();
  const db = getDb();

  db.update(changeBatches)
    .set({
      status: body.status,
      mergedAt: body.status === "merged" ? new Date().toISOString() : null,
      mergedBy: body.status === "merged" ? session.user.id : null,
    })
    .where(eq(changeBatches.id, batchId))
    .run();

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create apps/web/src/app/admin/batches/batches-client.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Batch {
  id: string;
  title: string;
  status: string;
  description: string;
  createdAt: string;
}

export function BatchesClient() {
  const [batches, setBatches] = useState<Batch[]>([]);

  function loadBatches() {
    fetch("/api/batches")
      .then((r) => r.json())
      .then(setBatches);
  }

  useEffect(() => { loadBatches(); }, []);

  async function mergeBatch(batchId: string) {
    await fetch(`/api/batches/${batchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "merged" }),
    });
    loadBatches();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Change Batches</h1>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell className="font-medium">{batch.title}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    batch.status === "merged"
                      ? "default"
                      : batch.status === "in_review"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {batch.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {new Date(batch.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {batch.status !== "merged" && (
                  <Button size="sm" onClick={() => mergeBatch(batch.id)}>
                    Merge &amp; Publish
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 4: Create apps/web/src/app/admin/batches/page.tsx**

```tsx
import { BatchesClient } from "./batches-client";

export default function AdminBatchesPage() {
  return <BatchesClient />;
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/batches/ apps/web/src/app/admin/batches/
git commit -m "feat: add change batch API and admin list with merge action"
```

---

## Phase 10: Theme System

### Task 17: Create theme API and seed built-in themes

**Files:**
- Create: `apps/web/src/app/api/themes/route.ts`
- Create: `apps/web/src/app/api/themes/[themeId]/route.ts`
- Create: `apps/web/src/lib/themes.ts`
- Create: `apps/web/src/lib/themes/seed.ts`

- [ ] **Step 1: Create apps/web/src/lib/themes.ts**

```typescript
import { getDb, themes } from "@pagekit/db";
import { eq } from "drizzle-orm";

export async function getThemes() {
  const db = getDb();
  return db.select().from(themes).all();
}

export async function getThemeById(themeId: string) {
  const db = getDb();
  const result = db
    .select()
    .from(themes)
    .where(eq(themes.id, themeId))
    .limit(1)
    .all();
  return result[0] ?? null;
}
```

- [ ] **Step 2: Create apps/web/src/lib/themes/seed.ts**

```typescript
import { getDb, themes } from "@pagekit/db";

export async function seedBuiltInThemes() {
  const db = getDb();

  const existing = db.select().from(themes).all();
  if (existing.length > 0) return;

  const builtIns = [
    {
      id: "default-light",
      name: "Default Light",
      isBuiltin: true,
      variables: JSON.stringify({
        "--color-primary": "#6366f1",
        "--color-bg": "#ffffff",
        "--color-surface": "#f8fafc",
        "--color-text": "#0f172a",
        "--font-heading": "Inter, sans-serif",
        "--font-body": "Inter, sans-serif",
        "--font-mono": "JetBrains Mono, monospace",
        "--radius": "0.5rem",
        "--sidebar-width": "280px",
      }),
      config: JSON.stringify({ navStyle: "sidebar", searchPosition: "header" }),
    },
    {
      id: "default-dark",
      name: "Default Dark",
      isBuiltin: true,
      variables: JSON.stringify({
        "--color-primary": "#818cf8",
        "--color-bg": "#0f172a",
        "--color-surface": "#1e293b",
        "--color-text": "#f1f5f9",
        "--font-heading": "Inter, sans-serif",
        "--font-body": "Inter, sans-serif",
        "--font-mono": "JetBrains Mono, monospace",
        "--radius": "0.5rem",
        "--sidebar-width": "280px",
      }),
      config: JSON.stringify({ navStyle: "sidebar", searchPosition: "header" }),
    },
  ];

  for (const t of builtIns) {
    db.insert(themes).values({
      ...t,
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).run();
  }
}
```

- [ ] **Step 3: Create apps/web/src/app/api/themes/route.ts**

```typescript
import { NextResponse } from "next/server";
import { getThemes, seedBuiltInThemes } from "@/lib/themes";

// Seed on first access
seedBuiltInThemes().catch(console.error);

export async function GET() {
  const themes = await getThemes();
  return NextResponse.json(themes);
}
```

- [ ] **Step 4: Create apps/web/src/app/api/themes/[themeId]/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, themes } from "@pagekit/db";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const { themeId } = await params;
  const db = getDb();
  const theme = db
    .select()
    .from(themes)
    .where(eq(themes.id, themeId))
    .limit(1)
    .all();

  if (!theme[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(theme[0]);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { themeId } = await params;
  const body = await req.json();
  const db = getDb();

  db.update(themes)
    .set({
      ...body,
      variables: body.variables ? body.variables : undefined,
      config: body.config ? body.config : undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(themes.id, themeId))
    .run();

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/themes/ apps/web/src/app/api/themes/
git commit -m "feat: add theme API with built-in light and dark theme seed"
```

---

### Task 18: Create theme admin pages with live preview

**Files:**
- Create: `apps/web/src/app/admin/themes/page.tsx`
- Create: `apps/web/src/app/admin/themes/[themeId]/page.tsx`
- Create: `apps/web/src/app/admin/themes/[themeId]/theme-editor-client.tsx`

- [ ] **Step 1: Create apps/web/src/app/admin/themes/page.tsx**

```tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getThemes } from "@/lib/themes";

export default async function AdminThemesPage() {
  const themes = await getThemes();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Themes</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map((theme) => {
          let vars: Record<string, string> = {};
          try {
            vars = JSON.parse(String(theme.variables));
          } catch {}

          return (
            <Link key={theme.id} href={`/admin/themes/${theme.id}`}>
              <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {theme.name}
                    {theme.isBuiltin && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                        Built-in
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded-full border"
                      style={{
                        backgroundColor: vars["--color-primary"] || "#ccc",
                      }}
                    />
                    <div
                      className="w-8 h-8 rounded-full border"
                      style={{
                        backgroundColor: vars["--color-bg"] || "#fff",
                      }}
                    />
                    <div
                      className="w-8 h-8 rounded-full border"
                      style={{
                        backgroundColor: vars["--color-text"] || "#000",
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/admin/themes/[themeId]/theme-editor-client.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ThemeData {
  id: string;
  name: string;
  variables: string | Record<string, string>;
  config: string | Record<string, unknown>;
}

export function ThemeEditorClient({ themeId }: { themeId: string }) {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeData | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/themes/${themeId}`)
      .then((r) => r.json())
      .then((data) => {
        setTheme(data);
        const vars = typeof data.variables === "string"
          ? JSON.parse(data.variables)
          : data.variables || {};
        setVariables(vars);
      });
  }, [themeId]);

  function updateVariable(key: string, value: string) {
    setVariables((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/themes/${themeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variables: JSON.stringify(variables) }),
    });
    setSaving(false);
    router.refresh();
  }

  if (!theme) return <p className="text-gray-500">Loading...</p>;

  const isColorLike = (k: string) =>
    k.includes("color") || k.includes("bg") || k.includes("surface") || k.includes("text");

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">{theme.name}</h2>
        <div className="space-y-4">
          {Object.entries(variables).map(([key, value]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{key}</label>
              <div className="flex items-center gap-2">
                {isColorLike(key) && (
                  <input
                    type="color"
                    value={String(value)}
                    onChange={(e) => updateVariable(key, e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border"
                  />
                )}
                <Input
                  value={String(value)}
                  onChange={(e) => updateVariable(key, e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={saving} className="mt-6 w-full">
          {saving ? "Saving..." : "Save Theme"}
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
        <div
          className="rounded-lg p-6 min-h-64 border"
          style={Object.fromEntries(
            Object.entries(variables).map(([k, v]) => [k, String(v)])
          )}
        >
          <div
            style={{
              backgroundColor: variables["--color-primary"] || "#6366f1",
            }}
            className="text-white px-4 py-2 rounded-t-lg font-semibold text-sm"
          >
            📄 Docs
          </div>
          <div
            style={{
              backgroundColor: variables["--color-surface"] || "#f8fafc",
            }}
            className="p-4 rounded-b-lg"
          >
            <p
              style={{ color: variables["--color-text"] || "#0f172a" }}
              className="font-semibold mb-2"
            >
              Welcome to PageKit
            </p>
            <p
              style={{ color: variables["--color-text"] || "#0f172a" }}
              className="text-sm opacity-70"
            >
              This is a live preview. Change values on the left to see them applied here instantly.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Create apps/web/src/app/admin/themes/[themeId]/page.tsx**

```tsx
import { ThemeEditorClient } from "./theme-editor-client";

export default async function ThemeEditorPage({
  params,
}: {
  params: Promise<{ themeId: string }>;
}) {
  const { themeId } = await params;
  return <ThemeEditorClient themeId={themeId} />;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/admin/themes/
git commit -m "feat: add theme admin pages with visual editor and live preview"
```

---

## Phase 11: Deployment

### Task 19: Create Dockerfile and docker-compose

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create root Dockerfile**

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/pagekit.db

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

RUN mkdir -p /data

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
version: "3.8"
services:
  pagekit:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - pagekit_data:/data
    environment:
      - DATABASE_PATH=/data/pagekit.db
      - AUTH_SECRET=${AUTH_SECRET:-change-me-in-production}
    restart: unless-stopped

volumes:
  pagekit_data:
```

- [ ] **Step 3: Commit**

```bash
git add Dockerfile docker-compose.yml
git commit -m "feat: add Dockerfile and docker-compose for single-container deployment"
```

---

## Phase 12: Polish & Integration

### Task 20: Create public landing page and published page renderer

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/[pageId]/page.tsx`

- [ ] **Step 1: Update apps/web/src/app/page.tsx**

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-5xl font-bold mb-4">📄 PageKit</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-md text-center">
        Open-source, self-hosted documentation platform.
        MDX. API references. Wiki pages. All in one.
      </p>
      <div className="flex gap-4">
        <Link
          href="/admin"
          className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
        >
          Admin Portal
        </Link>
        <Link
          href="https://github.com/pagekit/pagekit"
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          GitHub →
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/[pageId]/page.tsx**

```tsx
import { getPageById } from "@/lib/pages";
import { notFound } from "next/navigation";

export default async function PublicPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const page = await getPageById(pageId);

  if (!page || page.status !== "published") notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
      <div className="prose max-w-none">
        <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg">
          {page.content}
        </pre>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/
git commit -m "feat: add public landing page and published page renderer"
```

---

### Task 21: Wire up dashboard stats

**Files:**
- Modify: `apps/web/src/app/admin/page.tsx`
- Create: `apps/web/src/lib/dashboard.ts`

- [ ] **Step 1: Create apps/web/src/lib/dashboard.ts**

```typescript
import { getDb, pages, users, changeBatches } from "@pagekit/db";
import { count } from "drizzle-orm";

export async function getDashboardStats() {
  const db = getDb();
  const [pageResult] = db.select({ count: count() }).from(pages).all();
  const [userResult] = db.select({ count: count() }).from(users).all();
  const [batchResult] = db.select({ count: count() }).from(changeBatches).all();

  return {
    pageCount: pageResult?.count ?? 0,
    userCount: userResult?.count ?? 0,
    batchCount: batchResult?.count ?? 0,
  };
}
```

- [ ] **Step 2: Update apps/web/src/app/admin/page.tsx**

Replace the component with:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard";

export default async function AdminDashboard() {
  const session = await auth();
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Welcome, {session?.user?.name || "Admin"}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.pageCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.batchCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.userCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/admin/page.tsx apps/web/src/lib/dashboard.ts
git commit -m "feat: wire up dashboard with live stats from database"
```

---

### Task 22: Final build and integration verification

- [ ] **Step 1: Clean install and test**

Run:
```bash
rm -rf node_modules apps/web/node_modules packages/*/node_modules
pnpm install
pnpm run typecheck
```

Expected: No TypeScript errors across all packages.

- [ ] **Step 2: Full build**

Run: `pnpm run build`
Expected: Successful build of all packages and the Next.js app.

- [ ] **Step 3: Update pnpm-lock.yaml and commit**

```bash
git add pnpm-lock.yaml
git commit -m "chore: final build verification and dependency lock"
```
