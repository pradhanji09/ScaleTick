import { RedisService } from './../common/redis/redis.service';
import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly redisService: RedisService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const check = this.healthIndicatorService.check(key);
    try {
      await this.redisService.ping();
      return check.up();
    } catch (err) {
      console.log(err);
      return check.down('Redis check failed');
    }
  }
}
