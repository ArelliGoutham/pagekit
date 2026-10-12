import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ── Auth & Identity ─────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  provider: text("provider", { enum: ["oidc", "ldap", "local"] }).notNull(),
  providerId: text("provider_id"),
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
    .references(() => users.id),
  expires: text("expires").notNull(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
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
  expires: text("expires").notNull(),
});

export const authProviders = sqliteTable("auth_providers", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["oidc", "ldap", "saml"] }).notNull(),
  name: text("name").notNull(),
  config: text("config", { mode: "json" })
    .$type<Record<string, unknown>>()
    .notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ── Content ─────────────────────────────────────────────────────────────────────

export const pages = sqliteTable("pages", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  contentType: text("content_type", { enum: ["mdx", "openapi", "rich-text"] })
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
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'`),
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

// ── Navigation ──────────────────────────────────────────────────────────────────

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
  pageId: text("page_id").references(() => pages.id, {
    onDelete: "cascade",
  }),
  parentNodeId: text("parent_node_id"),
  label: text("label").notNull(),
  type: text("type", { enum: ["page", "folder", "divider", "link"] }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  icon: text("icon"),
});

// ── Change Batching ─────────────────────────────────────────────────────────────

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

// ── Themes ──────────────────────────────────────────────────────────────────────

export const themes = sqliteTable("themes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isBuiltin: integer("is_builtin", { mode: "boolean" }).notNull().default(false),
  variables: text("variables", { mode: "json" })
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'`),
  config: text("config", { mode: "json" })
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'`),
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