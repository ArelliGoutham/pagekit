"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Batch {
  id: string;
  title: string;
  status: string;
  description: string;
  createdAt: string;
}

export function BatchesClient() {
  const [batches, setBatches] = useState<Batch[]>([]);

  function loadBatches() {
    fetch("/api/batches")
      .then((r) => r.json())
      .then(setBatches);
  }

  useEffect(() => { loadBatches(); }, []);

  async function mergeBatch(batchId: string) {
    await fetch(`/api/batches/${batchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "merged" }),
    });
    loadBatches();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Change Batches</h1>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell className="font-medium">{batch.title}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    batch.status === "merged"
                      ? "default"
                      : batch.status === "in_review"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {batch.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {new Date(batch.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {batch.status !== "merged" && (
                  <Button size="sm" onClick={() => mergeBatch(batch.id)}>
                    Merge &amp; Publish
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}