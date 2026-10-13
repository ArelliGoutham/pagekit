import { NextResponse } from "next/server";
import { getMedia } from "@/lib/media";

export async function GET() {
  const media = getMedia();
  return NextResponse.json(media);
}