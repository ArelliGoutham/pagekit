"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function SplitPanelEditor({ pageId }: { pageId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [compiledOutput, setCompiledOutput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pages/${pageId}`)
      .then((r) => r.json())
      .then((page) => {
        if (page.title) setTitle(page.title);
        if (page.content) setContent(page.content);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pageId]);

  const updatePreview = useCallback(async (source: string) => {
    if (!source.trim()) {
      setCompiledOutput("");
      return;
    }
    try {
      const res = await fetch("/api/mdx/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      const { compiled } = await res.json();
      if (compiled) setCompiledOutput(compiled);
    } catch {
      // ignore preview errors
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => updatePreview(content), 500);
    return () => clearTimeout(timer);
  }, [content, updatePreview]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, changeSummary }),
    });
    setSaving(false);
    router.refresh();
  }

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4 gap-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title"
          className="text-xl font-bold w-96"
        />
        <div className="flex items-center gap-2">
          <Input
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="What changed?"
            className="w-64 text-sm"
          />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Draft"}
          </Button>
        </div>
      </div>
      <div className="flex flex-1 gap-0 border rounded-lg overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b uppercase">
            Editor
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Start writing MDX..."
            className="flex-1 border-0 rounded-none resize-none font-mono text-sm p-4 focus-visible:ring-0"
          />
        </div>
        <div className="w-px bg-gray-200" />
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b uppercase">
            Preview
          </div>
          <Card className="flex-1 border-0 rounded-none overflow-auto p-4">
            {compiledOutput ? (
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {compiledOutput}
              </pre>
            ) : (
              <p className="text-gray-400 text-sm">
                Start typing to see compiled MDX output...
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}