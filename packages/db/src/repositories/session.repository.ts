import { lt } from 'drizzle-orm';
import { BaseRepository } from './base.repository';
import { sessions } from '../schema';
import type { Session } from '@minimall/types';

/**
 * Session repository
 */
export class SessionRepository extends BaseRepository<Session> {
  constructor() {
    super(sessions);
  }


  /**
   * Find valid session
   */
  async findValidSession(id: string): Promise<Session | null> {
    const session = await this.findById(id);
    
    if (!session) return null;
    
    if (session.expiresAt && session.expiresAt < new Date()) {
      await this.delete(session.id);
      return null;
    }
    
    return session;
  }

  /**
   * Clean expired sessions
   */
  async cleanExpired(): Promise<number> {
    return this.deleteMany(
      lt(sessions.expiresAt, new Date())
    );
  }
}