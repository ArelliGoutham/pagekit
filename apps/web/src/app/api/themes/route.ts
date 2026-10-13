import { NextResponse } from "next/server";
import { getThemes } from "@/lib/themes";
import { seedBuiltInThemes } from "@/lib/themes/seed";

let seeded = false;

export async function GET() {
  if (!seeded) {
    seedBuiltInThemes();
    seeded = true;
  }
  const themes = getThemes();
  return NextResponse.json(themes);
}