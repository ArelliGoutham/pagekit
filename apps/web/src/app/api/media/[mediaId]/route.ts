import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import {
  getMediaById,
  confirmMediaUpload,
  deleteMedia,
} from "@/lib/media";
import { deleteFromS3 } from "@/lib/s3";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const { error } = await requireRole("admin", "editor");
  if (error) return error;

  const { mediaId } = await params;
  confirmMediaUpload(mediaId);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const { error } = await requireRole("admin");
  if (error) return error;

  const { mediaId } = await params;
  const record = getMediaById(mediaId);
  if (!record)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFromS3(record.s3Key);
  deleteMedia(mediaId);
  return NextResponse.json({ success: true });
}