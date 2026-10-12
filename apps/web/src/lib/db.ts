import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@pagekit/db/schema";

let db: ReturnType<typeof drizzle> | null = null;

export function getDb(databasePath?: string) {
  if (db) return db;

  const path = databasePath || process.env.DATABASE_PATH || "./pagekit.db";
  const sqlite = new Database(path);

  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  db = drizzle(sqlite, { schema });
  return db;
}

export { schema };