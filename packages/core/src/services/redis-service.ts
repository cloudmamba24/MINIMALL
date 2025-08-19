import Redis from "ioredis";
import { Queue, Worker, QueueEvents } from "bullmq";

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Redis for BullMQ (separate connection)
const bullConnection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "1"), // Use different DB for queues
  maxRetriesPerRequest: null,
});

export class RedisCache {
  private static instance: RedisCache;

  private constructor() {}

  static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await redis.del(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis DELETE error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      const result = await redis.del(...keys);
      return result;
    } catch (error) {
      console.error(`Redis DELETE pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set TTL on existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await redis.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      const result = await redis.incrby(key, by);
      return result;
    } catch (error) {
      console.error(`Redis INCREMENT error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get multiple keys at once
   */
  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await redis.mget(...keys);
      return values.map(v => v ? JSON.parse(v) as T : null);
    } catch (error) {
      console.error(`Redis MGET error:`, error);
      return keys.map(() => null);
    }
  }

  /**
   * Flush all cache (use with caution)
   */
  async flush(): Promise<boolean> {
    try {
      await redis.flushdb();
      return true;
    } catch (error) {
      console.error("Redis FLUSH error:", error);
      return false;
    }
  }
}

// Job Queue definitions
export const JobQueues = {
  mediaProcessing: new Queue("media-processing", { connection: bullConnection }),
  contentScheduling: new Queue("content-scheduling", { connection: bullConnection }),
  instagramSync: new Queue("instagram-sync", { connection: bullConnection }),
  analytics: new Queue("analytics", { connection: bullConnection }),
  notifications: new Queue("notifications", { connection: bullConnection }),
};

// Job types
export interface MediaProcessingJob {
  type: "upload" | "transform" | "thumbnail";
  assetId: string;
  url?: string;
  transformations?: any;
}

export interface ContentSchedulingJob {
  type: "publish" | "unpublish";
  tileId: string;
  configId: string;
  scheduledFor: Date;
}

export interface InstagramSyncJob {
  type: "fetch_posts" | "fetch_stories" | "fetch_reels";
  accountId: string;
  since?: Date;
}

export interface AnalyticsJob {
  type: "aggregate" | "export" | "cleanup";
  configId?: string;
  dateRange?: { start: Date; end: Date };
}

// Queue service for managing jobs
export class QueueService {
  private static instance: QueueService;
  private workers: Map<string, Worker> = new Map();

  private constructor() {}

  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  /**
   * Add a job to a queue
   */
  async addJob<T>(queueName: keyof typeof JobQueues, data: T, options?: {
    delay?: number;
    attempts?: number;
    backoff?: { type: "exponential" | "fixed"; delay: number };
    priority?: number;
    removeOnComplete?: boolean;
    removeOnFail?: boolean;
  }) {
    const queue = JobQueues[queueName];
    const job = await queue.add(queueName, data, {
      attempts: options?.attempts || 3,
      backoff: options?.backoff || { type: "exponential", delay: 2000 },
      delay: options?.delay,
      priority: options?.priority,
      removeOnComplete: options?.removeOnComplete ?? true,
      removeOnFail: options?.removeOnFail ?? false,
    });
    return job;
  }

  /**
   * Register a worker for a queue
   */
  registerWorker<T>(
    queueName: keyof typeof JobQueues,
    processor: (job: any) => Promise<any>,
    concurrency: number = 1
  ) {
    const worker = new Worker(
      queueName,
      processor,
      {
        connection: bullConnection,
        concurrency,
      }
    );

    worker.on("completed", (job) => {
      console.log(`Job ${job.id} completed in queue ${queueName}`);
    });

    worker.on("failed", (job, err) => {
      console.error(`Job ${job?.id} failed in queue ${queueName}:`, err);
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName: keyof typeof JobQueues) {
    const queue = JobQueues[queueName];
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Clean old jobs from queue
   */
  async cleanQueue(queueName: keyof typeof JobQueues, grace: number = 3600000) {
    const queue = JobQueues[queueName];
    await queue.clean(grace, 100, "completed");
    await queue.clean(grace, 100, "failed");
  }

  /**
   * Pause/resume queue
   */
  async pauseQueue(queueName: keyof typeof JobQueues) {
    await JobQueues[queueName].pause();
  }

  async resumeQueue(queueName: keyof typeof JobQueues) {
    await JobQueues[queueName].resume();
  }

  /**
   * Shutdown all workers
   */
  async shutdown() {
    for (const [name, worker] of this.workers) {
      await worker.close();
      console.log(`Worker ${name} closed`);
    }
    this.workers.clear();
  }
}

export const cache = RedisCache.getInstance();
export const queueService = QueueService.getInstance();