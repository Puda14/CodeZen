import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('contest/queue')
export class QueueController {
  constructor(@InjectQueue('contestQueue') private readonly contestQueue: Queue) { }

  @Get('status')
  async getQueueStatus() {
    const counts = await this.contestQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed'
    );

    const jobs = await this.contestQueue.getJobs(['waiting', 'delayed', 'completed', 'failed'], 0, 10);

    return {
      counts,
      jobs: await Promise.all(
        jobs.map(async (job) => ({
          id: job.id,
          name: job.name,
          state: await job.getState(),
          data: job.data,
          timestamp: job.timestamp,
          delay: job.opts.delay || 0,
        }))
      )
    };
  }
}
