import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // Idempotency
  async setProcessing(key: string): Promise<boolean> {
    const SHORT_TTL = 30; // 30s
    const result: string | null = await this.client.set(
      key,
      'PROCESSING',
      'EX',
      SHORT_TTL,
      'NX',
    );
    return result === 'OK';
  }

  async setCompleted(key: string, response: unknown): Promise<void> {
    const LONG_TTL = 86400; // 24 hours
    await this.client.set(
      key,
      JSON.stringify({ status: 'COMPLETED', data: response }),
      'EX',
      LONG_TTL,
    );
  }

  async getIdempotencyKey(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  // Distributed Lock
  async acquireLock(key: string, ttlSeconds: number): Promise<string | null> {
    const token = randomUUID();
    const result = await this.client.set(key, token, 'EX', ttlSeconds, 'NX');

    return result === 'OK' ? token : null;
  }

  async releaseLock(key: string, token: string): Promise<void> {
    const luaScript = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;

    await this.client.eval(luaScript, 1, key, token);
  }

  async ping(): Promise<void> {
    await this.client.ping();
  }
}
