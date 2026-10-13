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