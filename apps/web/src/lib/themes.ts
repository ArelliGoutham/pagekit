import { getDb, themes } from "@pagekit/db";
import { eq } from "drizzle-orm";

export function getThemes() {
  const db = getDb();
  return db.select().from(themes).all();
}

export function getThemeById(themeId: string) {
  const db = getDb();
  const result = db
    .select()
    .from(themes)
    .where(eq(themes.id, themeId))
    .limit(1)
    .all();
  return result[0] ?? null;
}