"use client";

import { useState } from "react";
import { RevisionList } from "./revision-list";
import { DiffViewer } from "./diff-viewer";

interface Page {
  id: string;
  content: string;
}

interface Revision {
  id: string;
  content: string;
  title: string;
  changeSummary: string;
  createdAt: string;
}

export function DiffClient({
  page,
  revisions,
}: {
  page: Page;
  revisions: Revision[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-3 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Revisions ({revisions.length})
        </h3>
        <RevisionList
          revisions={revisions}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
      <div className="col-span-2">
        <DiffViewer
          revisions={revisions}
          currentContent={page.content}
          selectedId={selectedId}
        />
      </div>
    </div>
  );
}