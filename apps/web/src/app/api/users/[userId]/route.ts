import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/roles";
import { updateUserRole } from "@/lib/users";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { session, error } = await requireRole("admin");
  if (error) return error;

  const { userId } = await params;
  if (session!.user!.id === userId) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 },
    );
  }

  const body = await req.json();
  const user = updateUserRole(userId, body.role);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}