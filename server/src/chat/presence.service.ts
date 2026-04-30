import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class PresenceService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env['REDIS_HOST'] ?? 'localhost',
      port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async setOnline(
    userId: string,
    socketId: string,
    relationshipId: string,
    role: string,
  ): Promise<void> {
    const key = `presence:${userId}`;
    await this.redis.hset(key, {
      socketId,
      relationshipId,
      role,
      connectedAt: Date.now().toString(),
    });
    await this.redis.expire(key, 3600);

    const roomKey = `room:${relationshipId}:members`;
    await this.redis.sadd(roomKey, userId);
  }

  async setOffline(userId: string, relationshipId?: string): Promise<void> {
    if (relationshipId) {
      const roomKey = `room:${relationshipId}:members`;
      await this.redis.srem(roomKey, userId);
    }
    await this.redis.del(`presence:${userId}`);
  }

  async isOnline(userId: string): Promise<boolean> {
    const exists = await this.redis.exists(`presence:${userId}`);
    return exists === 1;
  }

  async getOnlineMembers(relationshipId: string): Promise<string[]> {
    const roomKey = `room:${relationshipId}:members`;
    return this.redis.smembers(roomKey);
  }

  async getPresence(userId: string): Promise<{
    socketId: string;
    relationshipId: string;
    role: string;
    connectedAt: number;
  } | null> {
    const data = await this.redis.hgetall(`presence:${userId}`);
    if (!data || !data.socketId) {
      return null;
    }
    return {
      socketId: data.socketId,
      relationshipId: data.relationshipId,
      role: data.role,
      connectedAt: parseInt(data.connectedAt, 10),
    };
  }

  async getSocketId(userId: string): Promise<string | null> {
    const presence = await this.getPresence(userId);
    return presence?.socketId ?? null;
  }

  /**
   * Store a pending flirting proposal for an offline user.
   * Key: flirting-pending:<userId> → JSON { relationshipId, fromUserId }
   * TTL: 7 days
   */
  async storePendingProposal(userId: string, relationshipId: string, fromUserId: string): Promise<void> {
    const key = `flirting-pending:${userId}:${relationshipId}`;
    await this.redis.set(key, JSON.stringify({ relationshipId, fromUserId }), 'EX', 7 * 24 * 3600);
  }

  async getPendingProposals(userId: string): Promise<Array<{ relationshipId: string; fromUserId: string }>> {
    const pattern = `flirting-pending:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return [];

    const values = await this.redis.mget(...keys);
    return values
      .filter((v): v is string => v !== null)
      .map((v) => JSON.parse(v));
  }

  async removePendingProposal(userId: string, relationshipId: string): Promise<void> {
    const key = `flirting-pending:${userId}:${relationshipId}`;
    await this.redis.del(key);
  }
}
