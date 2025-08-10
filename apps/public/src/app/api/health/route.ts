import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    version: "1.0.0",
    routes: {
      homepage: "/",
      demo: "/g/demo",
      r2Debug: "/api/debug/r2",
      health: "/api/health",
    },
  });
}
