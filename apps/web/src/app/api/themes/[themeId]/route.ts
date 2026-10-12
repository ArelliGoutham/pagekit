import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, themes } from "@pagekit/db";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const { themeId } = await params;
  const db = getDb();
  const theme = db
    .select()
    .from(themes)
    .where(eq(themes.id, themeId))
    .limit(1)
    .all();

  if (!theme[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(theme[0]);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { themeId } = await params;
  const body = await req.json();
  const db = getDb();

  db.update(themes)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(themes.id, themeId))
    .run();

  return NextResponse.json({ success: true });
}