import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, navigationTrees } from "@pagekit/db";

export async function GET() {
  const db = getDb();
  const trees = db.select().from(navigationTrees).all();
  return NextResponse.json(trees);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const db = getDb();
  db.insert(navigationTrees).values({
    id: body.id,
    name: body.name,
    context: body.context || "docs",
  }).run();

  return NextResponse.json({ success: true }, { status: 201 });
}