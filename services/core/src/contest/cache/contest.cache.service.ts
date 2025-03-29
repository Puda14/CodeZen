import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ContestCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }
  async onModuleInit() {
    console.log('🔍 Testing Redis Cache...');

    try {
      await this.cacheManager.set('test_key', 'test_value', 600); // TTL = 600s
      console.log('✅ Cache SET successful');
      const value = await this.cacheManager.get('test_key');
      console.log('🔍 Retrieved from cache:', value);
    } catch (error) {
      console.error('❌ Cache test failed:', error.message);
    }
  }

  async getCachedContest(contestId: string): Promise<any | null> {
    const cachedContest = await this.cacheManager.get(`contest_${contestId}`);
    if (cachedContest) {
      console.log(`✅ Cache hit: Contest ${contestId} loaded from Redis`);
      return cachedContest;
    }
    console.log(`❌ Cache miss: Contest ${contestId} not found in Redis`);
    return null;
  }

  async setCachedContest(contestId: string, contestData: any, ttl: number = 600): Promise<void> {
    try {
      const cacheKey = `contest_${contestId}`;
      console.log(`Setting cache for key "${cacheKey}" with TTL ${ttl} seconds`);
      await this.cacheManager.set(cacheKey, contestData);
      console.log(`💾 Successfully cached contest "${cacheKey}"`);
    } catch (error) {
      console.error(`❌ Failed to cache contest "${contestId}":`, error.message);
      throw error;
    }
  }

  async deleteCachedContest(contestId: string): Promise<void> {
    await this.cacheManager.del(`contest_${contestId}`);
    console.log(`🗑️ Deleted cache for contest ${contestId}`);
  }
}
