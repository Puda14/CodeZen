export enum ContestStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  FINISHED = 'finished'
}

export enum LeaderboardStatus {
  OPEN = 'open',
  FROZEN = 'frozen',
  CLOSED = 'closed',
}

export enum RegistrationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum ContestPhase {
  BEFORE_CONTEST,
  DURING_CONTEST,
  AFTER_CONTEST,
  ANY
}

export const CONTEST_PHASE_KEY = 'contestPhase';
