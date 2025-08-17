import crypto from "node:crypto";

export interface CSRFTokenData {
  token: string;
  secret: string;
  timestamp: number;
}

// Constants
const TOKEN_LIFETIME = 60 * 60 * 1000; // 1 hour
const SECRET_LENGTH = 32;
const TOKEN_LENGTH = 32;

/**
 * Generate a new CSRF token and secret pair
 */
export function generateToken(): CSRFTokenData {
  const secret = crypto.randomBytes(SECRET_LENGTH).toString("hex");
  const token = crypto.randomBytes(TOKEN_LENGTH).toString("hex");

  return {
    token,
    secret,
    timestamp: Date.now(),
  };
}

/**
 * Create a CSRF token hash that can be safely stored in cookies
 */
export function createTokenHash(tokenData: CSRFTokenData, salt: string): string {
  return crypto
    .createHmac("sha256", salt)
    .update(`${tokenData.token}:${tokenData.secret}:${tokenData.timestamp}`)
    .digest("hex");
}

/**
 * Verify a CSRF token against the stored hash
 */
export function verifyToken(
  submittedToken: string,
  storedHash: string,
  salt: string,
  storedTimestamp: number
): boolean {
  try {
    // Check if token has expired
    if (Date.now() - storedTimestamp > TOKEN_LIFETIME) {
      return false;
    }

    // Create expected hash from submitted token
    const expectedHash = crypto
      .createHmac("sha256", salt)
      .update(`${submittedToken}:${salt}:${storedTimestamp}`)
      .digest("hex");

    // Use timing-safe comparison
    return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
}

/**
 * Generate a double-submit CSRF token (token + hash)
 */
export function generateDoubleSubmitToken(secret: string): {
  token: string;
  hash: string;
} {
  const token = crypto.randomBytes(TOKEN_LENGTH).toString("hex");
  const hash = crypto.createHmac("sha256", secret).update(token).digest("hex");

  return { token, hash };
}

/**
 * Verify double-submit CSRF token
 */
export function verifyDoubleSubmitToken(token: string, hash: string, secret: string): boolean {
  try {
    const expectedHash = crypto.createHmac("sha256", secret).update(token).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
}
