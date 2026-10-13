"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface MediaItem {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  s3Url: string;
  status: string;
  createdAt: string;
}

export function MediaClient() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadMedia() {
    fetch("/api/media")
      .then((r) => r.json())
      .then(setMediaItems);
  }

  useEffect(() => {
    loadMedia();
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const res = await fetch("/api/media/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      const { uploadUrl, mediaId } = await res.json();
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      await fetch(`/api/media/${mediaId}`, { method: "PATCH" });
      loadMedia();
    } catch (err) {
      console.error("Upload failed", err);
    }
    setUploading(false);
  }

  async function handleDelete(mediaId: string) {
    await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
    loadMedia();
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
  }

  const filtered = mediaItems.filter((m) =>
    m.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-64"
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            {item.mimeType.startsWith("image/") ? (
              <img
                src={item.s3Url}
                alt={item.filename}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-4xl text-gray-400">
                📄
              </div>
            )}
            <div className="p-3">
              <p className="text-sm font-medium truncate">{item.filename}</p>
              <p className="text-xs text-gray-500">
                {(item.size / 1024).toFixed(1)} KB
                {item.status === "pending" && (
                  <span className="ml-2 text-yellow-600">Processing...</span>
                )}
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyUrl(item.s3Url)}
                >
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-12">
            No media files yet. Click Upload to add files.
          </p>
        )}
      </div>
    </div>
  );
}