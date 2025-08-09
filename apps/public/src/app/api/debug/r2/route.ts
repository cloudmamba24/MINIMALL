import { NextResponse } from 'next/server';
import { R2ConfigService } from '@minimall/core/server';

export async function GET() {
  try {
    // Check if R2 environment variables are set
    const envVars = {
      R2_ENDPOINT: !!process.env.R2_ENDPOINT,
      R2_ACCESS_KEY: !!process.env.R2_ACCESS_KEY,
      R2_SECRET: !!process.env.R2_SECRET,
      R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,
    };

    // Try to perform a simple operation
    let connectionTest = null;
    let error = null;

    try {
      // Only test connection if all env vars are present
      if (Object.values(envVars).every(Boolean)) {
        const r2Service = new R2ConfigService();
        // Try to fetch a non-existent config to test connection
        await r2Service.getConfig('test-connection-' + Date.now());
      } else {
        connectionTest = 'SKIPPED - Missing environment variables';
      }
    } catch (testError) {
      if (testError instanceof Error) {
        if (testError.message.includes('Object not found')) {
          connectionTest = 'SUCCESS - Connection working (404 expected for test key)';
        } else {
          connectionTest = 'FAILED - Connection error';
          error = testError.message;
        }
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envVarsSet: envVars,
      connectionTest,
      error,
      r2Config: {
        endpoint: process.env.R2_ENDPOINT ? process.env.R2_ENDPOINT.substring(0, 50) + '...' : null,
        bucket: process.env.R2_BUCKET_NAME,
        hasCredentials: !!(process.env.R2_ACCESS_KEY && process.env.R2_SECRET),
      }
    });

  } catch (err) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}