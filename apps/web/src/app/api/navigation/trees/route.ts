import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { getDb, navigationTrees } from "@pagekit/db";

export async function GET() {
  const db = getDb();
  const trees = db.select().from(navigationTrees).all();
  return NextResponse.json(trees);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole("admin", "editor");
  if (error) return error;

  const body = await req.json();
  const db = getDb();
  db.insert(navigationTrees).values({
    id: body.id,
    name: body.name,
    context: body.context || "docs",
  }).run();

  return NextResponse.json({ success: true }, { status: 201 });
}