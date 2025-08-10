interface RateLimitEntry {
	count: number;
	resetTime: number;
}

export class RateLimiter {
	private store = new Map<string, RateLimitEntry>();
	private maxAttempts: number;
	private windowMs: number;

	constructor(maxAttempts: number = 10, windowMs: number = 60000) {
		this.maxAttempts = maxAttempts;
		this.windowMs = windowMs;
	}

	isAllowed(identifier: string): boolean {
		const now = Date.now();
		const entry = this.store.get(identifier);

		if (!entry) {
			this.store.set(identifier, { count: 1, resetTime: now + this.windowMs });
			return true;
		}

		if (now > entry.resetTime) {
			// Reset window
			this.store.set(identifier, { count: 1, resetTime: now + this.windowMs });
			return true;
		}

		if (entry.count >= this.maxAttempts) {
			return false;
		}

		entry.count++;
		return true;
	}

	getRemainingAttempts(identifier: string): number {
		const entry = this.store.get(identifier);
		if (!entry || Date.now() > entry.resetTime) {
			return this.maxAttempts;
		}
		return Math.max(0, this.maxAttempts - entry.count);
	}

	getTimeUntilReset(identifier: string): number {
		const entry = this.store.get(identifier);
		if (!entry || Date.now() > entry.resetTime) {
			return 0;
		}
		return entry.resetTime - Date.now();
	}

	// Clean up expired entries periodically
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.store.entries()) {
			if (now > entry.resetTime) {
				this.store.delete(key);
			}
		}
	}
}

// Global rate limiter instances
export const authRateLimiter = new RateLimiter(5, 60000); // 5 attempts per minute
export const installRateLimiter = new RateLimiter(10, 300000); // 10 installs per 5 minutes

// Cleanup expired entries every 5 minutes
setInterval(() => {
	authRateLimiter.cleanup();
	installRateLimiter.cleanup();
}, 300000);