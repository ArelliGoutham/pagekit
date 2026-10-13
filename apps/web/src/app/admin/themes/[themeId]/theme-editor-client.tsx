"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ThemeData {
  id: string;
  name: string;
  variables: string;
}

export function ThemeEditorClient({
  params,
}: {
  params: Promise<{ themeId: string }>;
}) {
  const { themeId } = use(params);
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
    const res = await fetch(`/api/themes/${themeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variables: JSON.stringify(variables) }),
    });
    if (res.ok) {
      // Re-fetch to sync local state with server
      const data = await fetch(`/api/themes/${themeId}`).then(r => r.json());
      const vars = typeof data.variables === "string"
        ? JSON.parse(data.variables)
        : data.variables || {};
      setVariables(vars);
    }
    setSaving(false);
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
            style={{ backgroundColor: variables["--color-primary"] || "#6366f1" }}
            className="text-white px-4 py-2 rounded-t-lg font-semibold text-sm"
          >
            📄 Docs
          </div>
          <div
            style={{ backgroundColor: variables["--color-surface"] || "#f8fafc" }}
            className="p-4 rounded-b-lg"
          >
            <p style={{ color: variables["--color-text"] || "#0f172a" }} className="font-semibold mb-2">
              Welcome to PageKit
            </p>
            <p style={{ color: variables["--color-text"] || "#0f172a" }} className="text-sm opacity-70">
              This is a live preview. Change values on the left to see them applied here instantly.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}