import { NextRequest, NextResponse } from "next/server";
import { compileMdx } from "@/lib/mdx";

export async function POST(req: NextRequest) {
  const { source } = await req.json();
  try {
    const compiled = await compileMdx(source);
    return NextResponse.json({ compiled });
  } catch {
    return NextResponse.json(
      { error: "MDX compilation failed" },
      { status: 400 }
    );
  }
}