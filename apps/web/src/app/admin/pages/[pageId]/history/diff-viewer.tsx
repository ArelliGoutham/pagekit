"use client";

import { diffLines, Change } from "diff";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Revision {
  id: string;
  content: string;
  title: string;
  changeSummary: string;
  createdAt: string;
}

export function DiffViewer({
  revisions,
  currentContent,
  selectedId,
}: {
  revisions: Revision[];
  currentContent: string;
  selectedId: string | null;
}) {
  const [mode, setMode] = useState<"side-by-side" | "unified">("unified");

  const selectedRevision = revisions.find((r) => r.id === selectedId);
  let changes: Change[] = [];

  if (selectedRevision) {
    changes = diffLines(selectedRevision.content, currentContent);
  }

  if (!selectedRevision) {
    return <p className="text-gray-500">Select a revision to compare.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Diff View</h3>
        <div className="flex gap-2">
          <Button
            variant={mode === "unified" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("unified")}
          >
            Unified
          </Button>
          <Button
            variant={mode === "side-by-side" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("side-by-side")}
          >
            Side by Side
          </Button>
        </div>
      </div>

      {mode === "unified" && (
        <div className="border rounded-lg overflow-hidden font-mono text-sm">
          <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">
            {selectedRevision.changeSummary || "Revision"} → Current Draft
          </div>
          <div className="p-4 max-h-96 overflow-auto">
            {changes.map((change, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap ${
                  change.added
                    ? "bg-green-50 text-green-800"
                    : change.removed
                    ? "bg-red-50 text-red-800"
                    : "text-gray-700"
                }`}
              >
                {change.added ? "+ " : change.removed ? "- " : "  "}
                {change.value}
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "side-by-side" && (
        <div className="grid grid-cols-2 border rounded-lg overflow-hidden font-mono text-sm">
          <div className="border-r">
            <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">
              {selectedRevision.changeSummary || "Revision"}
            </div>
            <div className="p-4 max-h-96 overflow-auto">
              {changes.map((change, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap ${
                    change.removed
                      ? "bg-red-50 text-red-800"
                      : change.added
                      ? "hidden"
                      : "text-gray-700"
                  }`}
                >
                  {change.value}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-500">
              Current Draft
            </div>
            <div className="p-4 max-h-96 overflow-auto">
              {changes.map((change, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap ${
                    change.added
                      ? "bg-green-50 text-green-800"
                      : change.removed
                      ? "hidden"
                      : "text-gray-700"
                  }`}
                >
                  {change.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}