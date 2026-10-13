import { getDb, media } from "@pagekit/db";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export function getMedia() {
  const db = getDb();
  return db.select().from(media).orderBy(desc(media.createdAt)).all();
}

export function getMediaById(mediaId: string) {
  const db = getDb();
  const result = db
    .select()
    .from(media)
    .where(eq(media.id, mediaId))
    .limit(1)
    .all();
  return result[0] ?? null;
}

export function createMediaRecord(input: {
  filename: string;
  mimeType: string;
  size: number;
  s3Key: string;
  s3Url: string;
  uploadedBy: string;
}) {
  const db = getDb();
  const record = {
    id: uuidv4(),
    ...input,
    status: "pending" as const,
  };
  db.insert(media).values(record).run();
  return record;
}

export function confirmMediaUpload(mediaId: string) {
  const db = getDb();
  db.update(media)
    .set({ status: "ready" })
    .where(eq(media.id, mediaId))
    .run();
}

export function deleteMedia(mediaId: string) {
  const db = getDb();
  db.delete(media).where(eq(media.id, mediaId)).run();
}