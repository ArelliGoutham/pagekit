import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { generateUploadUrl, getPublicUrl } from "@/lib/s3";
import { createMediaRecord } from "@/lib/media";

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin", "editor");
  if (error) return error;

  const { filename, contentType, size } = await req.json();
  const ext = filename.split(".").pop() || "bin";
  const s3Key = `uploads/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;
  const s3Url = getPublicUrl(s3Key);
  const uploadUrl = await generateUploadUrl(s3Key, contentType);

  const record = createMediaRecord({
    filename,
    mimeType: contentType,
    size: size || 0,
    s3Key,
    s3Url,
    uploadedBy: session!.user!.id!,
  });

  return NextResponse.json({ uploadUrl, mediaId: record.id, s3Key });
}