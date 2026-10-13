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