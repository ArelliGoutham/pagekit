"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewPageDialog } from "./new-page-dialog";

interface Page {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  layout: string;
}

export function PagesTable({ pages }: { pages: Page[] }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">All Pages ({pages.length})</h2>
        <NewPageDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Layout</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page.id}>
              <TableCell className="font-medium">{page.title}</TableCell>
              <TableCell className="font-mono text-sm text-gray-500">
                /{page.id}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    page.status === "published" ? "default" : "secondary"
                  }
                >
                  {page.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {page.layout}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {new Date(page.updatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="flex gap-2">
                <Link href={`/admin/pages/${page.id}/edit`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <Link href={`/admin/pages/${page.id}/history`}>
                  <Button variant="outline" size="sm">History</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
