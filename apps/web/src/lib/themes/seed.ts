import { getDb, themes } from "@pagekit/db";

export function seedBuiltInThemes() {
  const db = getDb();

  const existing = db.select().from(themes).all();
  if (existing.length > 0) return;

  const builtIns: (typeof themes.$inferInsert)[] = [
    {
      id: "default-light",
      name: "Default Light",
      isBuiltin: true,
      variables: {
        "--color-primary": "#6366f1",
        "--color-bg": "#ffffff",
        "--color-surface": "#f8fafc",
        "--color-text": "#0f172a",
        "--font-heading": "Inter, sans-serif",
        "--font-body": "Inter, sans-serif",
        "--font-mono": "JetBrains Mono, monospace",
        "--radius": "0.5rem",
        "--sidebar-width": "280px",
      },
      config: { navStyle: "sidebar", searchPosition: "header" },
    },
    {
      id: "default-dark",
      name: "Default Dark",
      isBuiltin: true,
      variables: {
        "--color-primary": "#818cf8",
        "--color-bg": "#0f172a",
        "--color-surface": "#1e293b",
        "--color-text": "#f1f5f9",
        "--font-heading": "Inter, sans-serif",
        "--font-body": "Inter, sans-serif",
        "--font-mono": "JetBrains Mono, monospace",
        "--radius": "0.5rem",
        "--sidebar-width": "280px",
      },
      config: { navStyle: "sidebar", searchPosition: "header" },
    },
  ];

  for (const t of builtIns) {
    db.insert(themes).values(t).run();
  }
}