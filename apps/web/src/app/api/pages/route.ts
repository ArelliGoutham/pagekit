import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPages, createPage } from "@/lib/pages";

export async function GET() {
  const pages = getPages();
  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const page = createPage({
    id: body.id,
    title: body.title,
    content: body.content,
    parentId: body.parentId,
    createdBy: session.user.id,
  });

  return NextResponse.json(page, { status: 201 });
}