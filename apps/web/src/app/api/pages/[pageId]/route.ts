import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import {
  getPageById,
  updatePage,
  deletePage,
  createPageRevision,
} from "@/lib/pages";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const page = getPageById(pageId);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { session, error } = await requireRole("admin", "editor");
  if (error) return error;

  const { pageId } = await params;
  const body = await req.json();

  // Create revision before updating if content changed
  if (body.content !== undefined) {
    const existing = getPageById(pageId);
    if (existing) {
      createPageRevision({
        pageId,
        content: existing.content,
        title: existing.title,
        changeSummary: body.changeSummary || "",
        createdBy: session!.user!.id!,
      });
    }
  }

  const page = updatePage(pageId, body);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { error } = await requireRole("admin");
  if (error) return error;

  const { pageId } = await params;
  deletePage(pageId);
  return NextResponse.json({ success: true });
}