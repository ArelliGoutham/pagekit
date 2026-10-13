# PageKit MVP Gaps — Design Specification

**Date:** 2026-10-13  
**Status:** Design  
**Author:** PageKit Team  
**Parent Spec:** [2026-10-12-pagekit-design.md](./2026-10-12-pagekit-design.md)

## Overview

Completes the 5 missing pieces from the MVP core platform: Settings management, User management, Media library with S3 storage, New page creation flow, and Role-based access enforcement. This brings the admin portal from functional prototype to production-ready admin experience.

## Scope

### 1. Settings Page (`/admin/settings`)

Two tabs: General and Auth Providers.

**General tab:**
- Site name (text input)
- Public URL (text input)
- Active theme (dropdown from `GET /api/themes`)
- Save → `PATCH /api/settings`

**Auth Providers tab:**
- List configured OIDC/LDAP providers with enabled/disabled toggle
- "Add Provider" dialog: name, type (OIDC/LDAP/SAML), issuer URL, client ID, client secret
- Edit/Delete existing providers with confirmation

**New database table:** `settings`
```
key        TEXT PK ("site_name", "public_url", "active_theme_id")
value      TEXT
updatedAt  TEXT (ISO 8601)
```

**Existing table used:** `authProviders` (already in schema)

**New API routes:**
- `GET /api/settings` — returns all settings as key-value object
- `PATCH /api/settings` — update settings (admin only)
- `GET /api/auth-providers` — list providers
- `POST /api/auth-providers` — create provider (admin only)
- `PATCH /api/auth-providers/[id]` — update provider (admin only, toggles enabled, edits config)
- `DELETE /api/auth-providers/[id]` — delete provider (admin only)

### 2. Users Page (`/admin/users`)

**UI:**
- Table: Name, Email, Role (colored badge), Provider (OIDC/LDAP badge), Last Login
- "Invite User" button → dialog with email input + role dropdown
- Inline role change via dropdown on role badge
- Current user cannot change own role

**New API routes:**
- `GET /api/users` — list all users (admin only)
- `POST /api/users` — create user record with email + role (admin only)
- `PATCH /api/users/[userId]` — change role (admin only, cannot modify self)

**Note:** User creation is manual records — actual auth linking happens when user first signs in via OIDC/LDAP. Auth.js matches provider email to existing user.

### 3. Media Library (`/admin/media`)

S3-compatible storage via presigned upload URLs.

**Flow:**
1. Client calls `POST /api/media/upload-url` → gets presigned PUT URL + media record ID
2. Client uploads file directly to presigned URL (no server bandwidth)
3. Client calls `PATCH /api/media/[id]` to mark upload complete
4. File available at S3 URL, displayed in media grid

**Environment variables:**
```
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=pagekit-media
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

**New database table:** `media`
```
id          TEXT PK (UUID)
filename    TEXT (original filename)
mimeType    TEXT
size        INTEGER (bytes)
s3Key       TEXT (path in bucket)
s3Url       TEXT (public or presigned URL)
status      TEXT ("pending" | "ready" | "error")
uploadedBy  TEXT FK → users.id
createdAt   TEXT (ISO 8601)
```

**UI:**
- Grid layout (3-4 columns) with image thumbnails
- Click → full image + copy URL + delete
- Upload button with drag-and-drop zone
- Search/filter by filename

**New API routes:**
- `GET /api/media` — list media (admin/editor)
- `POST /api/media/upload-url` — generate presigned upload URL (admin/editor)
- `PATCH /api/media/[id]` — confirm upload complete (admin/editor)
- `DELETE /api/media/[id]` — delete from S3 + remove record (admin only)

**S3 SDK:** `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`

### 4. New Page Creation Flow

Replaces the removed "New Page" button with a working creation flow.

**Flow:**
1. Click "New Page" on `/admin/pages` → opens dialog
2. Dialog: Page ID (slug) + Title fields
3. Submit → `POST /api/pages` (existing API)
4. On success → redirect to `/admin/pages/[pageId]/edit`

**UI:** shadcn/ui Dialog component on the pages list page. No new route needed.

**Changes:**
- Add "New Page" button to `apps/web/src/app/admin/pages/pages-table.tsx`
- Create `apps/web/src/app/admin/pages/new-page-dialog.tsx`
- Wire up create → redirect

### 5. Role Enforcement

Replaces simple "is logged in" checks with role-based access control.

**New file:** `apps/web/src/lib/auth/roles.ts`

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Role = "admin" | "editor" | "viewer";

export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const userRole = ((session.user as { role?: string }).role || "viewer") as Role;
  if (!roles.includes(userRole)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}
```

**Permission matrix:**

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| View admin pages | ✅ | ✅ | ✅ |
| Create/edit pages | ✅ | ✅ | ❌ |
| Delete pages | ✅ | ❌ | ❌ |
| Manage navigation | ✅ | ✅ | ❌ |
| Create/merge batches | ✅ | ✅ | ❌ |
| Manage themes | ✅ | ❌ | ❌ |
| Manage settings | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Upload media | ✅ | ✅ | ❌ |
| Delete media | ✅ | ❌ | ❌ |

**Applied to:** All POST/PATCH/DELETE endpoints in pages, batches, themes, navigation, settings, users, and media APIs.

## Files Changed/Created

### New files
| File | Purpose |
|------|---------|
| `apps/web/src/lib/auth/roles.ts` | Role enforcement helper |
| `apps/web/src/app/admin/settings/page.tsx` | Settings page |
| `apps/web/src/app/admin/settings/settings-client.tsx` | Settings client component |
| `apps/web/src/app/admin/users/page.tsx` | Users page |
| `apps/web/src/app/admin/users/users-client.tsx` | Users client component |
| `apps/web/src/app/admin/users/invite-dialog.tsx` | Invite user dialog |
| `apps/web/src/app/admin/media/page.tsx` | Media page |
| `apps/web/src/app/admin/media/media-client.tsx` | Media client component |
| `apps/web/src/app/admin/pages/new-page-dialog.tsx` | New page dialog |
| `apps/web/src/app/api/settings/route.ts` | Settings API |
| `apps/web/src/app/api/users/route.ts` | Users list/create API |
| `apps/web/src/app/api/users/[userId]/route.ts` | User role update API |
| `apps/web/src/app/api/media/route.ts` | Media list API |
| `apps/web/src/app/api/media/upload-url/route.ts` | Presigned URL API |
| `apps/web/src/app/api/media/[mediaId]/route.ts` | Media confirm/delete API |
| `apps/web/src/lib/settings.ts` | Settings DB helpers |
| `apps/web/src/lib/users.ts` | Users DB helpers |
| `apps/web/src/lib/media.ts` | Media DB helpers |
| `apps/web/src/lib/s3.ts` | S3 client + presigned URL helper |

### Modified files
| File | Change |
|------|--------|
| `apps/web/src/app/admin/admin-nav.tsx` | Add Settings, Users, Media to nav |
| `apps/web/src/app/admin/pages/pages-table.tsx` | Add New Page button + dialog |
| `packages/db/src/schema.ts` | Add `settings` and `media` tables |
| `apps/web/src/app/api/pages/route.ts` | Apply role enforcement |
| `apps/web/src/app/api/pages/[pageId]/route.ts` | Apply role enforcement |
| `apps/web/src/app/api/batches/route.ts` | Apply role enforcement |
| `apps/web/src/app/api/batches/[batchId]/route.ts` | Apply role enforcement |
| `apps/web/src/app/api/themes/[themeId]/route.ts` | Apply role enforcement |
| `apps/web/src/app/api/navigation/trees/route.ts` | Apply role enforcement |
| `apps/web/src/app/api/navigation/trees/[treeId]/nodes/route.ts` | Apply role enforcement |

### New packages
- `@aws-sdk/client-s3` — S3 operations
- `@aws-sdk/s3-request-presigner` — presigned URL generation