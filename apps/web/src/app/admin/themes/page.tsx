import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getThemes } from "@/lib/themes";

export default function AdminThemesPage() {
  const themes = getThemes();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Themes</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map((theme) => {
          const vars = (theme.variables as Record<string, string>) || {};

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
                    <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: vars["--color-primary"] || "#ccc" }} />
                    <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: vars["--color-bg"] || "#fff" }} />
                    <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: vars["--color-text"] || "#000" }} />
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