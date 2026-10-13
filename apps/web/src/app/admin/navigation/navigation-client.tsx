"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TreeNode {
  id: string;
  label: string;
  type: string;
  pageId: string | null;
  sortOrder: number;
}

export function NavigationClient() {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/navigation/trees/main-docs/nodes")
      .then((r) => r.json())
      .then(setNodes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Navigation</h1>
        <Button>Add Node</Button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            {nodes.length} navigation items.
          </p>
          {nodes
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((node) => (
              <div
                key={node.id}
                className="flex items-center gap-4 py-2 px-4 border rounded-lg mb-2"
              >
                <span className="text-sm text-gray-400">☰</span>
                <span className="flex-1 font-medium">{node.label}</span>
                <span className="text-xs text-gray-400 uppercase">
                  {node.type}
                </span>
                {node.pageId && (
                  <span className="text-xs font-mono text-gray-400">
                    → {node.pageId}
                  </span>
                )}
              </div>
            ))}
        </Card>
      )}
    </div>
  );
}