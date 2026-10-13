import { getDb, settings } from "@pagekit/db";
import { eq } from "drizzle-orm";

export function getSettings(): Record<string, string> {
  const db = getDb();
  const rows = db.select().from(settings).all();
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export function updateSettings(updates: Record<string, string>) {
  const db = getDb();
  const now = new Date().toISOString();
  for (const [key, value] of Object.entries(updates)) {
    const existing = db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1)
      .all();

    if (existing.length > 0) {
      db.update(settings)
        .set({ value, updatedAt: now })
        .where(eq(settings.key, key))
        .run();
    } else {
      db.insert(settings).values({ key, value, updatedAt: now }).run();
    }
  }
}