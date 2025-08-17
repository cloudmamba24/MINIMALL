/**
 * R2 Service with Required Configuration
 * This version throws errors instead of returning null, ensuring operations don't silently fail
 */

import { R2ConfigService } from "./r2";

/**
 * Get R2 service instance, throwing error if not configured
 * Use this when R2 is required for the operation to succeed
 */
export function getR2ServiceRequired(): R2ConfigService {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY;
  const secretAccessKey = process.env.R2_SECRET;
  const bucketName = process.env.R2_BUCKET_NAME;

  const missing = [];
  if (!endpoint) missing.push('R2_ENDPOINT');
  if (!accessKeyId) missing.push('R2_ACCESS_KEY');
  if (!secretAccessKey) missing.push('R2_SECRET');
  if (!bucketName) missing.push('R2_BUCKET_NAME');

  if (missing.length > 0) {
    const error = new Error(
      `R2 storage is not configured. Missing environment variables: ${missing.join(', ')}. ` +
      `Please add these to your .env.local file.`
    );
    console.error("[R2] Configuration error:", error.message);
    throw error;
  }

  try {
    return new R2ConfigService();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[R2] Failed to initialize R2 service:", message);
    throw new Error(`Failed to initialize R2 storage service: ${message}`);
  }
}