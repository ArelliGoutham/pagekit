import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function getS3Client() {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    forcePathStyle: true,
  });
}

export async function generateUploadUrl(key: string, contentType: string) {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET || "pagekit-media",
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export function getPublicUrl(key: string) {
  const endpoint = process.env.S3_ENDPOINT || "";
  const bucket = process.env.S3_BUCKET || "pagekit-media";
  return `${endpoint}/${bucket}/${key}`;
}

export async function deleteFromS3(key: string) {
  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET || "pagekit-media",
    Key: key,
  });
  await client.send(command);
}