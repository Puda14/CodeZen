import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private redisHealth: RedisHealthIndicator,
  ) {}

  // @Get()
  // @HealthCheck()
  // check() {
  //   return this.health.check([
  //     () => this.redisHealth.isHealthy('redis')
  //   ]);
  // }
}
