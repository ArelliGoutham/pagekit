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