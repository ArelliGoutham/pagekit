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

export function getPages() {
  const db = getDb();
  return db.select().from(pages).orderBy(desc(pages.updatedAt)).all();
}

export function getPageById(pageId: string) {
  const db = getDb();
  const result = db
    .select()
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1)
    .all();
  return result[0] ?? null;
}

export function createPage(input: CreatePageInput) {
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

export function updatePage(pageId: string, input: UpdatePageInput) {
  const db = getDb();
  const existing = getPageById(pageId);
  if (!existing) return null;

  db.update(pages)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(pages.id, pageId))
    .run();
  return getPageById(pageId);
}

export function deletePage(pageId: string) {
  const db = getDb();
  db.delete(pages).where(eq(pages.id, pageId)).run();
}

export function getPageRevisions(pageId: string) {
  const db = getDb();
  return db
    .select()
    .from(pageRevisions)
    .where(eq(pageRevisions.pageId, pageId))
    .orderBy(desc(pageRevisions.createdAt))
    .all();
}

export function createPageRevision(input: {
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