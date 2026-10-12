import { getDb, schema } from "@/lib/db";
import { count } from "drizzle-orm";

export function getDashboardStats() {
  const db = getDb();
  const { pages, users, changeBatches } = schema;
  const [pageResult] = db.select({ count: count() }).from(pages).all();
  const [userResult] = db.select({ count: count() }).from(users).all();
  const [batchResult] = db.select({ count: count() }).from(changeBatches).all();

  return {
    pageCount: pageResult?.count ?? 0,
    userCount: userResult?.count ?? 0,
    batchCount: batchResult?.count ?? 0,
  };
}