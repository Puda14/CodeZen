import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ContestService } from '../contest.service';
import { ContestStatus } from '../../common/enums/contest.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ContestCacheService } from '../cache/contest.cache.service';
import { LeaderboardService } from '../../leaderboard/leaderboard.service';

@Processor('contestQueue')
export class ContestProcessor extends WorkerHost {
  private readonly logger = new Logger(ContestProcessor.name);

  constructor(
    private readonly contestService: ContestService,
    private readonly contestCacheService: ContestCacheService,
    @InjectQueue('contestQueue') private readonly contestQueue: Queue,
    private readonly leaderboardService: LeaderboardService,
  ) {
    super();
    this.logger.log('✅ ContestProcessor initialized.');
  }

  async process(job: Job<any>) {
    this.logger.log(`🚀 Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'updateStatus': {
        const { contestId, newStatus } = job.data;
        this.logger.log(`🔄 Updating contest ${contestId} status to ${newStatus}`);

        try {
          const updatedContest = await this.contestService.updateContestStatus(contestId, newStatus);

          if (!updatedContest) {
            this.logger.warn(`⚠️ Contest ${contestId} not found.`);
            return;
          }

          this.logger.log(`✅ Contest ${contestId} updated to ${newStatus}`);

          if (newStatus === ContestStatus.ONGOING) {
            this.logger.log(`💾 Caching contest ${contestId}`);

            const formattedContest = await this.contestService.fetchFullContestDetails(contestId);

            await this.contestCacheService.setCachedContest(contestId, formattedContest, 6000000);

            const approvedUsers = formattedContest.registrations
              .filter(r => r.status === 'approved')
              .map(r => ({
                _id: r.user._id.toString(),
                username: r.user.username,
                email: r.user.email
              }));

            const problemIds = formattedContest.problems.map((p) => p._id.toString());

            await this.leaderboardService.deleteIfExist(contestId);
            await this.leaderboardService.initLeaderboardFromContest(
              updatedContest._id.toString(),
              approvedUsers,
              problemIds
            );

            // Schedule the contest to finish
            const now = new Date();
            const endTime = new Date(updatedContest.end_time);
            const delay = endTime.getTime() - now.getTime();

            if (delay > 0) {
              this.logger.log(`📅 Scheduling contest ${contestId} to finish in ${delay} ms`);
              await this.contestQueue.add(
                'updateStatus',
                { contestId, newStatus: ContestStatus.FINISHED },
                { delay }
              );
            } else {
              this.logger.warn(`⚠️ Contest ${contestId} end_time already passed, skipping scheduling.`);
            }
          }

          if (newStatus === ContestStatus.FINISHED) {
            this.logger.log(`🗑️ Removing contest ${contestId} from cache`);
            await this.contestCacheService.deleteCachedContest(contestId);
            await this.leaderboardService.saveToMongo(contestId);
          }

        } catch (error) {
          this.logger.error(`❌ Failed to update contest ${contestId}: ${error.message}`);
          throw error;
        }
        break;
      }

      default:
        this.logger.warn(`⚠️ Unknown job type: ${job.name}`);
        break;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ Job ${job.id} completed successfully.`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ Job ${job.id} failed: ${error.message}`);
  }
}
