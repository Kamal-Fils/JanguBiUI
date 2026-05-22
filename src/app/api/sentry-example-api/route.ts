import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  throw new Error("Test Sentry — erreur serveur intentionnelle");
  return NextResponse.json({ ok: true });
}
