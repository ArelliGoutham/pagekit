# MVP Gaps — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the 5 missing MVP pieces: Settings page, Users page, Media library (S3), New page creation flow, and role-based access enforcement across all API routes.

**Architecture:** Extends the existing Next.js App Router admin portal with 3 new admin pages, 4 new API route groups, 2 new DB tables, 1 role enforcement helper, and S3-compatible storage integration. All changes follow the existing patterns: server components fetching data, client components handling interactions, DB helpers using sync `better-sqlite3`.

**Tech Stack:** Next.js 15, TypeScript, SQLite (better-sqlite3), Drizzle ORM, shadcn/ui, S3 SDK (@aws-sdk/client-s3), Auth.js v5

---

## Task 1: Add settings and media tables to DB schema

**Files:**
- Modify: `packages/db/src/schema.ts`
- Create: `packages/db/drizzle/0001_add_settings_media.sql` (via drizzle-kit generate)

- [ ] **Step 1: Add settings and media tables to packages/db/src/schema.ts**

Add these two table definitions after the `themes` table:

```typescript
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull().default(0),
  s3Key: text("s3_key").notNull(),
  s3Url: text("s3_url").notNull(),
  status: text("status", { enum: ["pending", "ready", "error"] })
    .notNull()
    .default("pending"),
  uploadedBy: text("uploaded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
```

- [ ] **Step 2: Generate migration**

Run: `cd packages/db && pnpm db:generate`
Expected: Creates migration SQL in `packages/db/drizzle/`

- [ ] **Step 3: Verify typecheck**

Run: `pnpm run typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/db/
git commit -m "feat: add settings and media tables to DB schema"
```

---

## Task 2: Create role enforcement helper

**Files:**
- Create: `apps/web/src/lib/auth/roles.ts`

- [ ] **Step 1: Create apps/web/src/lib/auth/roles.ts**

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Role = "admin" | "editor" | "viewer";

export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }
  const userRole = ((session.user as { role?: string }).role ||
    "viewer") as Role;
  if (!roles.includes(userRole)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }
  return { session, error: null };
}
```

- [ ] **Step 2: Verify lint + typecheck**

Run: `pnpm run lint && pnpm run typecheck`
Expected: Both pass

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/auth/roles.ts
git commit -m "feat: add role enforcement helper with admin/editor/viewer tiers"
```

---

## Task 3: Apply role enforcement to existing API routes

**Files:**
- Modify: `apps/web/src/app/api/pages/route.ts`
- Modify: `apps/web/src/app/api/pages/[pageId]/route.ts`
- Modify: `apps/web/src/app/api/batches/route.ts`
- Modify: `apps/web/src/app/api/batches/[batchId]/route.ts`
- Modify: `apps/web/src/app/api/themes/[themeId]/route.ts`
- Modify: `apps/web/src/app/api/navigation/trees/route.ts`
- Modify: `apps/web/src/app/api/navigation/trees/[treeId]/nodes/route.ts`

- [ ] **Step 1: Update pages/route.ts — POST requires admin/editor, GET is public**

In `apps/web/src/app/api/pages/route.ts`, replace the POST handler's auth check:

```typescript
import { requireRole } from "@/lib/auth/roles";

// In POST:
export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin", "editor");
  if (error) return error;

  const body = await req.json();
  const page = createPage({
    id: body.id,
    title: body.title,
    content: body.content,
    parentId: body.parentId,
    createdBy: session!.user!.id!,
  });

  return NextResponse.json(page, { status: 201 });
}
```

- [ ] **Step 2: Update pages/[pageId]/route.ts — PATCH requires admin/editor, DELETE requires admin**

```typescript
import { requireRole } from "@/lib/auth/roles";

// In PATCH:
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { session, error } = await requireRole("admin", "editor");
  if (error) return error;

  const { pageId } = await params;
  const body = await req.json();

  if (body.content !== undefined) {
    const existing = getPageById(pageId);
    if (existing) {
      createPageRevision({
        pageId,
        content: existing.content,
        title: existing.title,
        changeSummary: body.changeSummary || "",
        createdBy: session!.user!.id!,
      });
    }
  }

  const page = updatePage(pageId, body);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

// In DELETE:
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { error } = await requireRole("admin");
  if (error) return error;

  const { pageId } = await params;
  deletePage(pageId);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Update batches/route.ts — POST requires admin/editor, GET is public**

```typescript
import { requireRole } from "@/lib/auth/roles";

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin", "editor");
  if (error) return error;
  // ... rest of existing POST handler using session!
}
```

- [ ] **Step 4: Update batches/[batchId]/route.ts — PATCH requires admin/editor**

```typescript
import { requireRole } from "@/lib/auth/roles";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { session, error } = await requireRole("admin", "editor");
  if (error) return error;
  // ... rest uses session!
}
```

- [ ] **Step 5: Update themes/[themeId]/route.ts — PATCH requires admin**

```typescript
import { requireRole } from "@/lib/auth/roles";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const { error } = await requireRole("admin");
  if (error) return error;
  // ... rest of existing handler
}
```

- [ ] **Step 6: Update navigation routes — POST requires admin/editor**

In both `navigation/trees/route.ts` and `navigation/trees/[treeId]/nodes/route.ts`:

```typescript
import { requireRole } from "@/lib/auth/roles";

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin", "editor");
  if (error) return error;
  // ... rest uses session!.user!.id!
}
```

- [ ] **Step 7: Verify build**

Run: `pnpm run build`
Expected: Successful

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/api/
git commit -m "feat: enforce role-based access on all API mutation endpoints"
```

---

## Task 4: Create settings page (backend)

**Files:**
- Create: `apps/web/src/lib/settings.ts`
- Create: `apps/web/src/app/api/settings/route.ts`

- [ ] **Step 1: Create apps/web/src/lib/settings.ts**

```typescript
import { getDb, settings } from "@pagekit/db";

export function getSettings() {
  const db = getDb();
  const rows = db.select().from(settings).all();
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export function updateSettings(updates: Record<string, string>) {
  const db = getDb();
  for (const [key, value] of Object.entries(updates)) {
    db.insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date().toISOString() } })
      .run();
  }
}
```

- [ ] **Step 2: Create apps/web/src/app/api/settings/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { getSettings, updateSettings } from "@/lib/settings";

export async function GET() {
  const settings = getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireRole("admin");
  if (error) return error;

  const body = await req.json();
  updateSettings(body);
  return NextResponse.json(getSettings());
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm run build`
Expected: Successful

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/settings.ts apps/web/src/app/api/settings/
git commit -m "feat: add settings API with key-value store"
```

---

## Task 5: Create settings page (frontend)

**Files:**
- Create: `apps/web/src/app/admin/settings/page.tsx`
- Create: `apps/web/src/app/admin/settings/settings-client.tsx`

- [ ] **Step 1: Create apps/web/src/app/admin/settings/settings-client.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Theme {
  id: string;
  name: string;
}

export function SettingsClient() {
  const [siteName, setSiteName] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [activeThemeId, setActiveThemeId] = useState("");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.site_name) setSiteName(s.site_name);
        if (s.public_url) setPublicUrl(s.public_url);
        if (s.active_theme_id) setActiveThemeId(s.active_theme_id);
      });
    fetch("/api/themes")
      .then((r) => r.json())
      .then(setThemes);
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site_name: siteName,
        public_url: publicUrl,
        active_theme_id: activeThemeId,
      }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="auth">Auth Providers</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Site Name</label>
                <Input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="My Documentation"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Public URL</label>
                <Input
                  value={publicUrl}
                  onChange={(e) => setPublicUrl(e.target.value)}
                  placeholder="https://docs.example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Active Theme</label>
                <Select value={activeThemeId} onValueChange={setActiveThemeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Auth Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                Configure OIDC, LDAP, or SAML providers for authentication.
                Changes take effect on next sign-in.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Create apps/web/src/app/admin/settings/page.tsx**

```tsx
import { SettingsClient } from "./settings-client";

export default function AdminSettingsPage() {
  return <SettingsClient />;
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm run build`
Expected: Successful

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/admin/settings/
git commit -m "feat: add settings admin page with general and auth provider tabs"
```

---

## Task 6: Create users management (backend + frontend)

**Files:**
- Create: `apps/web/src/lib/users.ts`
- Create: `apps/web/src/app/api/users/route.ts`
- Create: `apps/web/src/app/api/users/[userId]/route.ts`
- Create: `apps/web/src/app/admin/users/page.tsx`
- Create: `apps/web/src/app/admin/users/users-client.tsx`

- [ ] **Step 1: Create apps/web/src/lib/users.ts**

```typescript
import { getDb, users } from "@pagekit/db";
import { v4 as uuidv4 } from "uuid";

export function getUsers() {
  const db = getDb();
  return db.select().from(users).all();
}

export function getUserById(userId: string) {
  const db = getDb();
  const result = db.select().from(users).where(eq(users.id, userId)).limit(1).all();
  return result[0] ?? null;
}

export function createUser(input: { email: string; name?: string; role: string }) {
  const db = getDb();
  const user = {
    id: uuidv4(),
    email: input.email,
    name: input.name || input.email.split("@")[0] || "User",
    provider: "local" as const,
    providerId: input.email,
    role: input.role,
  };
  db.insert(users).values(user).run();
  return user;
}

export function updateUserRole(userId: string, role: string) {
  const db = getDb();
  db.update(users).set({ role }).where(eq(users.id, userId)).run();
  return getUserById(userId);
}
```

Requires: `import { eq } from "drizzle-orm";` at top.

- [ ] **Step 2: Create apps/web/src/app/api/users/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { getUsers, createUser } from "@/lib/users";

export async function GET() {
  const { error } = await requireRole("admin");
  if (error) return error;

  const users = getUsers();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole("admin");
  if (error) return error;

  const body = await req.json();
  const user = createUser({
    email: body.email,
    name: body.name,
    role: body.role || "viewer",
  });

  return NextResponse.json(user, { status: 201 });
}
```

- [ ] **Step 3: Create apps/web/src/app/api/users/[userId]/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { updateUserRole } from "@/lib/users";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  const { userId } = await params;
  if (session!.user!.id === userId) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const user = updateUserRole(userId, body.role);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}
```

- [ ] **Step 4: Create apps/web/src/app/admin/users/users-client.tsx**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  provider: string;
  lastLoginAt: string | null;
}

const roleColors: Record<string, string> = {
  admin: "bg-indigo-100 text-indigo-800",
  editor: "bg-blue-100 text-blue-800",
  viewer: "bg-gray-100 text-gray-800",
};

export function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);

  function loadUsers() {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers);
  }

  useEffect(() => { loadUsers(); }, []);

  async function changeRole(userId: string, role: string) {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    loadUsers();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select value={user.role} onValueChange={(r) => changeRole(user.id, r)}>
                  <SelectTrigger className="w-28">
                    <SelectValue>
                      <Badge className={roleColors[user.role] || ""}>
                        {user.role}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{user.provider}</Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString()
                  : "Never"}
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  Resend Invite
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 5: Create apps/web/src/app/admin/users/page.tsx**

```tsx
import { UsersClient } from "./users-client";

export default function AdminUsersPage() {
  return <UsersClient />;
}
```

- [ ] **Step 6: Verify build**

Run: `pnpm run build`
Expected: Successful

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/users.ts apps/web/src/app/api/users/ apps/web/src/app/admin/users/
git commit -m "feat: add user management API and admin page with role editing"
```

---

## Task 7: Create media library (backend)

**Files:**
- Create: `apps/web/src/lib/s3.ts`
- Create: `apps/web/src/lib/media.ts`
- Create: `apps/web/src/app/api/media/route.ts`
- Create: `apps/web/src/app/api/media/upload-url/route.ts`
- Create: `apps/web/src/app/api/media/[mediaId]/route.ts`

- [ ] **Step 1: Install S3 packages**

Run: `cd apps/web && pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
Expected: Installed

- [ ] **Step 2: Create apps/web/src/lib/s3.ts**

```typescript
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
```

- [ ] **Step 3: Create apps/web/src/lib/media.ts**

```typescript
import { getDb, media } from "@pagekit/db";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export function getMedia() {
  const db = getDb();
  return db.select().from(media).orderBy(desc(media.createdAt)).all();
}

export function getMediaById(mediaId: string) {
  const db = getDb();
  const result = db.select().from(media).where(eq(media.id, mediaId)).limit(1).all();
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
  db.update(media).set({ status: "ready" }).where(eq(media.id, mediaId)).run();
}

export function deleteMedia(mediaId: string) {
  const db = getDb();
  db.delete(media).where(eq(media.id, mediaId)).run();
}
```

- [ ] **Step 4: Create apps/web/src/app/api/media/upload-url/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { generateUploadUrl, getPublicUrl } from "@/lib/s3";
import { createMediaRecord } from "@/lib/media";

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("admin", "editor");
  if (error) return error;

  const { filename, contentType, size } = await req.json();
  const ext = filename.split(".").pop() || "bin";
  const s3Key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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

  return NextResponse.json({
    uploadUrl,
    mediaId: record.id,
    s3Key,
  });
}
```

- [ ] **Step 5: Create apps/web/src/app/api/media/route.ts**

```typescript
import { NextResponse } from "next/server";
import { getMedia } from "@/lib/media";

export async function GET() {
  const media = getMedia();
  return NextResponse.json(media);
}
```

- [ ] **Step 6: Create apps/web/src/app/api/media/[mediaId]/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { getMediaById, confirmMediaUpload, deleteMedia } from "@/lib/media";
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
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFromS3(record.s3Key);
  deleteMedia(mediaId);
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 7: Verify build**

Run: `pnpm run build`
Expected: Successful

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/lib/s3.ts apps/web/src/lib/media.ts apps/web/src/app/api/media/
git commit -m "feat: add media library API with S3 presigned upload support"
```

---

## Task 8: Create media library (frontend)

**Files:**
- Create: `apps/web/src/app/admin/media/page.tsx`
- Create: `apps/web/src/app/admin/media/media-client.tsx`

- [ ] **Step 1: Create apps/web/src/app/admin/media/media-client.tsx**

```tsx
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

  useEffect(() => { loadMedia(); }, []);

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
```

- [ ] **Step 2: Create apps/web/src/app/admin/media/page.tsx**

```tsx
import { MediaClient } from "./media-client";

export default function AdminMediaPage() {
  return <MediaClient />;
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm run build`
Expected: Successful

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/admin/media/
git commit -m "feat: add media library admin page with upload and grid view"
```

---

## Task 9: Add new page creation dialog

**Files:**
- Create: `apps/web/src/app/admin/pages/new-page-dialog.tsx`
- Modify: `apps/web/src/app/admin/pages/pages-table.tsx`

- [ ] **Step 1: Create apps/web/src/app/admin/pages/new-page-dialog.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewPageDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pageId, setPageId] = useState("");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!pageId.trim() || !title.trim()) return;
    setCreating(true);
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pageId.trim(), title: title.trim() }),
    });
    if (res.ok) {
      setOpen(false);
      router.push(`/admin/pages/${pageId.trim()}/edit`);
    }
    setCreating(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Page</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Page</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium block mb-1">Page ID (slug)</label>
            <Input
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              placeholder="getting-started"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL-safe identifier. Example: getting-started
            </p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Getting Started"
            />
          </div>
          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? "Creating..." : "Create Page"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Update apps/web/src/app/admin/pages/pages-table.tsx**

Replace the heading div with one that includes the NewPageDialog:

```tsx
import { NewPageDialog } from "./new-page-dialog";

// Replace the flex container:
<div className="flex justify-between items-center mb-4">
  <h2 className="text-xl font-semibold">All Pages ({pages.length})</h2>
  <NewPageDialog />
</div>
```

- [ ] **Step 3: Verify build**

Run: `pnpm run build`
Expected: Successful

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/admin/pages/
git commit -m "feat: add new page creation dialog with slug and title"
```

---

## Task 10: Restore Settings, Users, Media to admin nav

**Files:**
- Modify: `apps/web/src/app/admin/admin-nav.tsx`

- [ ] **Step 1: Add Settings, Users, Media back to navItems**

```typescript
const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/navigation", label: "Navigation" },
  { href: "/admin/batches", label: "Batches" },
  { href: "/admin/themes", label: "Themes" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/media", label: "Media" },
];
```

- [ ] **Step 2: Verify build**

Run: `pnpm run build`
Expected: Successful

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/admin/admin-nav.tsx
git commit -m "feat: restore settings, users, and media to admin navigation"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run all checks**

```bash
pnpm run typecheck && pnpm run lint && pnpm run build
```

Expected: All 3 pass with zero errors.

- [ ] **Step 2: Verify all new routes appear in build output**

Check that build output includes:
- `/admin/settings`
- `/admin/users`
- `/admin/media`
- `/api/settings`
- `/api/users`
- `/api/users/[userId]`
- `/api/media`
- `/api/media/upload-url`
- `/api/media/[mediaId]`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: final build verification for MVP gaps"
```