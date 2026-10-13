"use client";

interface Revision {
  id: string;
  changeSummary: string;
  createdAt: string;
}

export function RevisionList({
  revisions,
  selectedId,
  onSelect,
}: {
  revisions: Revision[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {revisions.map((rev) => (
        <button
          key={rev.id}
          onClick={() => onSelect(rev.id)}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            selectedId === rev.id
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <p className="font-medium text-sm">
            {rev.changeSummary || "No description"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(rev.createdAt).toLocaleString()}
          </p>
        </button>
      ))}
      {revisions.length === 0 && (
        <p className="text-sm text-gray-400">No revisions yet.</p>
      )}
    </div>
  );
}