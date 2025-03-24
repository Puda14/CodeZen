import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contest, ContestDocument } from './contest.schema';
import { ContestPhase, CONTEST_PHASE_KEY } from '../common/enums/contest.enum';

@Injectable()
export class ContestStatusGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Contest.name) private contestModel: Model<ContestDocument>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPhase = this.reflector.getAllAndOverride<ContestPhase>(
      CONTEST_PHASE_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );

    if (requiredPhase === undefined || requiredPhase === ContestPhase.ANY) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const contestId = request.params.contestId || request.params.id;

    if (!contestId) {
      return true;
    }

    const contest = await this.contestModel.findById(contestId);
    if (!contest) {
      throw new ForbiddenException('Contest not found');
    }

    const now = new Date();
    const isBeforeContest = now < contest.start_time;
    const isDuringContest = now >= contest.start_time && now <= contest.end_time;
    const isAfterContest = now > contest.end_time;

    if (requiredPhase === ContestPhase.BEFORE_CONTEST && !isBeforeContest) {
      throw new ForbiddenException('This action is only allowed before the contest starts');
    }

    if (requiredPhase === ContestPhase.DURING_CONTEST && !isDuringContest) {
      throw new ForbiddenException('This action is only allowed during the contest');
    }

    if (requiredPhase === ContestPhase.AFTER_CONTEST && !isAfterContest) {
      throw new ForbiddenException('This action is only allowed after the contest ends');
    }

    return true;
  }
}
