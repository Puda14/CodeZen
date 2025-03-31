import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  // private readonly redisClient: Redis;
  // private readonly logger = new Logger(RedisHealthIndicator.name);
  // constructor() {
  //   super();
  //   this.redisClient = new Redis({
  //     host: process.env.REDIS_HOST || '',
  //     port: parseInt(process.env.REDIS_PORT || '6379', 10),
  //     retryStrategy: (times) => Math.min(times * 100, 3000)
  //   });
  // }
  // async isHealthy(key: string): Promise<HealthIndicatorResult> {
  //   try {
  //     const ping = await this.redisClient.ping();
  //     return this.getStatus(key, ping === 'PONG');
  //   } catch (error) {
  //     this.logger.error(`Redis health check failed: ${error.message}`);
  //     throw new HealthCheckError('Redis connection failed', error);
  //   }
  // }
}
