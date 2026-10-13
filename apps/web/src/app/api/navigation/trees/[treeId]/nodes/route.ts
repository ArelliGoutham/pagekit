import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { getDb, navigationNodes } from "@pagekit/db";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ treeId: string }> }
) {
  const { treeId } = await params;
  const db = getDb();
  const nodes = db
    .select()
    .from(navigationNodes)
    .where(eq(navigationNodes.treeId, treeId))
    .all();
  return NextResponse.json(nodes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ treeId: string }> }
) {
  const { error } = await requireRole("admin", "editor");
  if (error) return error;

  const { treeId } = await params;
  const body = await req.json();
  const db = getDb();

  db.insert(navigationNodes).values({
    id: body.id,
    treeId,
    pageId: body.pageId || null,
    parentNodeId: body.parentNodeId || null,
    label: body.label,
    type: body.type || "page",
    sortOrder: body.sortOrder || 0,
    icon: body.icon || null,
  }).run();

  return NextResponse.json({ success: true }, { status: 201 });
}