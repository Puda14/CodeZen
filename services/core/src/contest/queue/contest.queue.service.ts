import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Contest, ContestDocument } from '../contest.schema';
import { ContestStatus } from '../../common/enums/contest.enum';

@Injectable()
export class ContestQueueService implements OnModuleInit {
  constructor(
    @InjectModel(Contest.name) private contestModel: Model<ContestDocument>,
    @InjectQueue('contestQueue') private readonly contestQueue: Queue
  ) { }

  async onModuleInit() {
    console.log('🔄 Cleaning old delayed jobs...');
    await this.cleanupDelayedJobs();

    console.log('🔄 Loading upcoming contests into queue...');
    await this.scheduleUpcomingContests();
  }

  async cleanupDelayedJobs() {
    const jobs = await this.contestQueue.getJobs(['delayed']);

    if (jobs.length === 0) {
      console.log('✅ No delayed jobs to remove.');
      return;
    }

    console.log(`🗑️ Removing ${jobs.length} delayed jobs...`);

    await Promise.all(
      jobs.map(async (job) => {
        console.log(`🗑️ Removing job ${job.id} for contest ${job.data.contestId}`);
        return job.remove();
      })
    );

    console.log('✅ All delayed jobs removed.');
  }

  async scheduleUpcomingContests() {
    const nowUtc = new Date(new Date().toISOString());
    const upcomingContests = await this.contestModel.find({
      status: ContestStatus.UPCOMING,
      start_time: { $gt: nowUtc }
    });

    for (const contest of upcomingContests) {
      const startTime = new Date(contest.start_time);
      const delay = startTime.getTime() - nowUtc.getTime();

      console.log(`📌 Scheduling contest ${contest._id} with delay ${delay} ms`);

      if (delay > 0) {
        const job = await this.contestQueue.add(
          'updateStatus',
          { contestId: contest._id, newStatus: ContestStatus.ONGOING },
          { delay }
        );
        console.log(`✅ Job ${job.id} added for contest ${contest._id}`);
      }
    }
    console.log('✅ All upcoming contests have been scheduled.');
  }

  async scheduleContest(contest: ContestDocument) {
    const nowUtc = new Date(new Date().toISOString());
    const startTime = new Date(contest.start_time);
    const delay = startTime.getTime() - nowUtc.getTime();

    if (delay > 0 && contest.status === ContestStatus.UPCOMING) {
      console.log(`📌 Scheduling contest ${contest._id} with delay ${delay} ms`);

      const job = await this.contestQueue.add(
        'updateStatus',
        { contestId: contest._id, newStatus: ContestStatus.ONGOING },
        { delay }
      );

      console.log(`✅ Job ${job.id} added for contest ${contest._id}`);
      return job;
    } else {
      console.log(`⏭️ Skipping scheduling for contest ${contest._id} - no delay needed or not in UPCOMING status`);
      return null;
    }
  }

  async getDelayedJobsForContest(contestId: string) {
    const jobs = await this.contestQueue.getJobs(['delayed']);
    return jobs.filter(job => job.data.contestId === contestId);
  }

  async removeJobById(jobId: string) {
    const job = await this.contestQueue.getJob(jobId);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  }

  async scheduleFinishContest(contest: ContestDocument) {
    const nowUtc = new Date(new Date().toISOString());
    const endTime = new Date(contest.end_time);
    const delay = endTime.getTime() - nowUtc.getTime();

    if (delay > 0) {
      console.log(`📌 Scheduling contest ${contest._id} to finish in ${delay} ms`);

      const job = await this.contestQueue.add(
        'updateStatus',
        { contestId: contest._id, newStatus: ContestStatus.FINISHED },
        { delay }
      );

      console.log(`✅ Job ${job.id} added for contest ${contest._id} to finish`);
      return job;
    } else {
      console.log(`⏭️ Skipping scheduling for contest ${contest._id} - already past end_time`);
      return null;
    }
  }

}
