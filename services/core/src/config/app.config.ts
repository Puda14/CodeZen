import { time } from 'console';

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
};
