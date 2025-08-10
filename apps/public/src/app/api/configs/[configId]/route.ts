import { type NextRequest, NextResponse } from "next/server";

// DEPRECATED: Redirect to canonical config endpoint
// The plural route had problematic demo fallbacks in production
// Use /api/config/[configId] instead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  const { configId } = await params;
  const { searchParams } = new URL(request.url);
  
  // Preserve query parameters in redirect
  const queryString = searchParams.toString();
  const redirectUrl = `/api/config/${configId}${queryString ? `?${queryString}` : ""}`;
  
  // Permanent redirect to canonical endpoint
  return NextResponse.redirect(new URL(redirectUrl, request.url), 301);
}

// DEPRECATED: Write operations moved to admin app only
export async function PUT() {
  return NextResponse.json(
    { error: "Config updates moved to admin app. Use admin API for writes." }, 
    { status: 410 } // Gone
  );
}