"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Theme {
  id: string;
  name: string;
}

export function SettingsClient() {
  const [siteName, setSiteName] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [activeThemeId, setActiveThemeId] = useState("");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.site_name) setSiteName(s.site_name);
        if (s.public_url) setPublicUrl(s.public_url);
        if (s.active_theme_id) setActiveThemeId(s.active_theme_id);
      });
    fetch("/api/themes")
      .then((r) => r.json())
      .then(setThemes);
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site_name: siteName,
        public_url: publicUrl,
        active_theme_id: activeThemeId,
      }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="auth">Auth Providers</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Site Name
                </label>
                <Input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="My Documentation"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Public URL
                </label>
                <Input
                  value={publicUrl}
                  onChange={(e) => setPublicUrl(e.target.value)}
                  placeholder="https://docs.example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Active Theme
                </label>
                <Select value={activeThemeId} onValueChange={(v) => setActiveThemeId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Auth Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                Configure OIDC, LDAP, or SAML providers for authentication.
                Changes take effect on next sign-in.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}