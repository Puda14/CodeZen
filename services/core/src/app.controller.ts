import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  async getHello(): Promise<string> {
    await this.cacheManager.set('testing-key', 'Hello world!!!!');
    return this.appService.getHello();
  }

  @Get('cache')
  async getCache(): Promise<string | null> {
    return await this.cacheManager.get('testing-key');
  }
}
