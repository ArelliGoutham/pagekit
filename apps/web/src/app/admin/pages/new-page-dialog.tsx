"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewPageDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pageId, setPageId] = useState("");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!pageId.trim() || !title.trim()) return;
    setCreating(true);
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pageId.trim(), title: title.trim() }),
    });
    if (res.ok) {
      setOpen(false);
      router.push(`/admin/pages/${pageId.trim()}/edit`);
    }
    setCreating(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>New Page</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Page</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium block mb-1">Page ID (slug)</label>
            <Input value={pageId} onChange={(e) => setPageId(e.target.value)} placeholder="getting-started" />
            <p className="text-xs text-gray-500 mt-1">URL-safe identifier. Example: getting-started</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Getting Started" />
          </div>
          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? "Creating..." : "Create Page"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}