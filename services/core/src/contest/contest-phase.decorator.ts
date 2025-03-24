import { SetMetadata } from '@nestjs/common';
import { ContestPhase, CONTEST_PHASE_KEY } from '../common/enums/contest.enum';

export const ContestPhaseRequired = (phase: ContestPhase) => SetMetadata(CONTEST_PHASE_KEY, phase);
