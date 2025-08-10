import crypto from 'crypto';

export interface CSRFTokenData {
	token: string;
	secret: string;
	timestamp: number;
}

export class CSRFProtection {
	private static readonly TOKEN_LIFETIME = 60 * 60 * 1000; // 1 hour
	private static readonly SECRET_LENGTH = 32;
	private static readonly TOKEN_LENGTH = 32;

	/**
	 * Generate a new CSRF token and secret pair
	 */
	static generateToken(): CSRFTokenData {
		const secret = crypto.randomBytes(CSRFProtection.SECRET_LENGTH).toString('hex');
		const token = crypto.randomBytes(CSRFProtection.TOKEN_LENGTH).toString('hex');
		
		return {
			token,
			secret,
			timestamp: Date.now(),
		};
	}

	/**
	 * Create a CSRF token hash that can be safely stored in cookies
	 */
	static createTokenHash(tokenData: CSRFTokenData, salt: string): string {
		return crypto
			.createHmac('sha256', salt)
			.update(`${tokenData.token}:${tokenData.secret}:${tokenData.timestamp}`)
			.digest('hex');
	}

	/**
	 * Verify a CSRF token against the stored hash
	 */
	static verifyToken(
		submittedToken: string, 
		storedHash: string, 
		salt: string, 
		storedTimestamp: number
	): boolean {
		try {
			// Check if token has expired
			if (Date.now() - storedTimestamp > CSRFProtection.TOKEN_LIFETIME) {
				return false;
			}

			// Create expected hash from submitted token
			const expectedHash = crypto
				.createHmac('sha256', salt)
				.update(`${submittedToken}:${salt}:${storedTimestamp}`)
				.digest('hex');

			// Use timing-safe comparison
			return crypto.timingSafeEqual(
				Buffer.from(storedHash, 'hex'),
				Buffer.from(expectedHash, 'hex')
			);
		} catch {
			return false;
		}
	}

	/**
	 * Generate a double-submit CSRF token (token + hash)
	 */
	static generateDoubleSubmitToken(secret: string): { token: string; hash: string } {
		const token = crypto.randomBytes(CSRFProtection.TOKEN_LENGTH).toString('hex');
		const hash = crypto
			.createHmac('sha256', secret)
			.update(token)
			.digest('hex');

		return { token, hash };
	}

	/**
	 * Verify double-submit CSRF token
	 */
	static verifyDoubleSubmitToken(token: string, hash: string, secret: string): boolean {
		try {
			const expectedHash = crypto
				.createHmac('sha256', secret)
				.update(token)
				.digest('hex');

			return crypto.timingSafeEqual(
				Buffer.from(hash, 'hex'),
				Buffer.from(expectedHash, 'hex')
			);
		} catch {
			return false;
		}
	}
}