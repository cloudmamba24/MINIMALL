import { NextResponse } from 'next/server';

export async function GET() {
  const timestamp = new Date().toISOString();
  const environment = process.env.NODE_ENV;

  // Check all critical environment variables
  const envCheck = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    R2_ENDPOINT: !!process.env.R2_ENDPOINT,
    R2_ACCESS_KEY: !!process.env.R2_ACCESS_KEY,
    R2_SECRET: !!process.env.R2_SECRET,
    R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: !!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    SHOPIFY_DOMAIN: !!process.env.SHOPIFY_DOMAIN,
  };

  // Calculate health score
  const totalChecks = Object.keys(envCheck).length;
  const passedChecks = Object.values(envCheck).filter(Boolean).length;
  const healthScore = Math.round((passedChecks / totalChecks) * 100);

  // Determine overall status
  let status = 'CRITICAL';
  if (healthScore >= 80) status = 'HEALTHY';
  else if (healthScore >= 60) status = 'DEGRADED';
  else if (healthScore >= 40) status = 'WARNING';

  // Enterprise features status
  const enterpriseFeatures = {
    database: envCheck.DATABASE_URL,
    r2Storage: envCheck.R2_ENDPOINT && envCheck.R2_ACCESS_KEY && envCheck.R2_SECRET && envCheck.R2_BUCKET_NAME,
    shopifyIntegration: envCheck.SHOPIFY_STOREFRONT_ACCESS_TOKEN && envCheck.SHOPIFY_DOMAIN,
  };

  return NextResponse.json({
    timestamp,
    environment,
    status,
    healthScore,
    summary: `${passedChecks}/${totalChecks} systems configured`,
    environmentVariables: envCheck,
    enterpriseFeatures,
    recommendations: [
      ...(!enterpriseFeatures.database ? ['Configure DATABASE_URL for config storage and analytics'] : []),
      ...(!enterpriseFeatures.r2Storage ? ['Configure R2 credentials for asset storage'] : []),
      ...(!enterpriseFeatures.shopifyIntegration ? ['Configure Shopify credentials for cart functionality'] : []),
    ],
    nextSteps: {
      database: '/api/debug/db',
      r2Storage: '/api/debug/r2',
      documentation: '/docs/deployment/ENVIRONMENT-SETUP.md'
    }
  });
}