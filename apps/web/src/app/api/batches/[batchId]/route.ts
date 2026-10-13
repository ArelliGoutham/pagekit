import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { getDb, changeBatches, changeBatchRevisions } from "@pagekit/db";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
  const db = getDb();
  const batch = db
    .select()
    .from(changeBatches)
    .where(eq(changeBatches.id, batchId))
    .limit(1)
    .all();

  if (!batch[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const revisionLinks = db
    .select()
    .from(changeBatchRevisions)
    .where(eq(changeBatchRevisions.batchId, batchId))
    .all();

  return NextResponse.json({ ...batch[0], revisionLinks });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { session, error } = await requireRole("admin", "editor");
  if (error) return error;

  const { batchId } = await params;
  const body = await req.json();
  const db = getDb();

  db.update(changeBatches)
    .set({
      status: body.status,
      mergedAt: body.status === "merged" ? new Date().toISOString() : null,
      mergedBy: body.status === "merged" ? session!.user!.id! : null,
    })
    .where(eq(changeBatches.id, batchId))
    .run();

  return NextResponse.json({ success: true });
}