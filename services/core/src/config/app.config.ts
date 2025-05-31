import { time } from 'console';
import { Leaderboard } from 'src/leaderboard/leaderboard.schema';

export const AppConfig = {
  problem: {
    minSubmissions: 1,
    maxSubmissions: 50,
    defaultSubmissions: 10,
  },
  internalApiKey: process.env.INTERNAL_API_KEY || 'default-key',
  testcase: {
    timeout: {
      default: 1,
      min: 1,
      max: 5,
    },
  },
  cache: {
    contestTtl: 6000000, //seconds
    LeaderboardTtl: 6000000, //seconds
  },
};
