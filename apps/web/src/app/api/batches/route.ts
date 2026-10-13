import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { getDb, changeBatches, changeBatchRevisions } from "@pagekit/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const db = getDb();
  const batches = db.select().from(changeBatches).all();
  return NextResponse.json(batches);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin", "editor");
  if (error) return error;

  const body = await req.json();
  const batchId = uuidv4();
  const db = getDb();

  db.insert(changeBatches).values({
    id: batchId,
    title: body.title,
    description: body.description || "",
    createdBy: session!.user!.id!,
    status: "draft",
  }).run();

  if (body.revisionIds && Array.isArray(body.revisionIds)) {
    for (const revisionId of body.revisionIds) {
      db.insert(changeBatchRevisions).values({
        batchId,
        revisionId,
      }).run();
    }
  }

  return NextResponse.json({ id: batchId }, { status: 201 });
}