import { NextResponse } from "next/server";

// Test endpoint to create a config without database
export async function GET() {
  const testConfig = {
    id: "test-" + Math.random().toString(36).substr(2, 9),
    success: true,
    message: "Test config created",
    viewUrl: null as string | null
  };
  
  testConfig.viewUrl = `https://minimall-tau.vercel.app/g/${testConfig.id}`;
  
  return NextResponse.json({
    ...testConfig,
    instructions: [
      "1. This created a test config ID without database",
      "2. To make it work, you'd need to manually save this ID",
      "3. Or fix the DATABASE_URL on Vercel",
      "4. The demo page at /g/demo already works with real Shopify data"
    ]
  });
}