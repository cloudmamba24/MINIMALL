import { createDatabase } from "@minimall/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return NextResponse.json(
        {
          status: "ERROR",
          message: "DATABASE_URL environment variable not set",
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        },
        { status: 500 }
      );
    }

    // Test database connection
    let connectionTest = null;
    let error = null;
    let tableCount = 0;

    try {
      const db = createDatabase(databaseUrl);

      // Simple connection test - try to execute a basic query
      const result = await db.execute(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      tableCount = Number(result[0]?.table_count) || 0;
      connectionTest = "SUCCESS - Database connection working";
    } catch (dbError) {
      connectionTest = "FAILED - Database connection error";
      error = dbError instanceof Error ? dbError.message : "Unknown database error";
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      status: error ? "ERROR" : "OK",
      database: {
        url: databaseUrl ? `${databaseUrl.split("@")[0]}@***` : null,
        connectionTest,
        tableCount,
        error,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "ERROR",
        message: "Debug endpoint failed",
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
