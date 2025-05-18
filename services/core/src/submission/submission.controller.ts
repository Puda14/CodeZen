import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { SubmissionDto } from './dto/submission.dto';
import { InternalApiGuard } from '../auth/internal-api.guard';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('submission')
export class SubmissionController {
  constructor(
    private readonly submissionService: SubmissionService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  @Post()
  @UseGuards(InternalApiGuard)
  async createSubmission(@Body() body: SubmissionDto) {
    return this.submissionService.createSubmission(body);
  }

  @Get('count')
  @UseGuards(InternalApiGuard)
  async getSubmissionCount(
    @Query('userId') userId: string,
    @Query('contestId') contestId: string,
    @Query('problemId') problemId: string,
  ) {
    const count = await this.submissionService.getSubmissionCount(
      userId,
      contestId,
      problemId,
    );
    return { count };
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getUserSubmissionsInContest(
    @Query('contest') contest: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;
    return this.submissionService.getUserSubmissionsInContest(userId, contest);
  }

  @Get('owner')
  @UseGuards(JwtAuthGuard)
  async getAllSubmissionsForOwner(
    @Query('contest') contest: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;
    return this.submissionService.getAllSubmissionsForContest(contest, userId);
  }

  @Get('check/semantic-code')
  @UseGuards(JwtAuthGuard)
  async getCheckSemanticCode(
    @Query('contest') contest: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;

    const submissions = await this.submissionService.getCheckSemanticCodeLight(
      contest,
      userId,
    );

    const internalApiKey = this.configService.get<string>('INTERNAL_API_KEY');

    const response = await firstValueFrom(
      this.httpService.post(
        'http://check-code-service:8004/semantic-code',
        submissions,
        {
          headers: {
            'x-internal-api-key': internalApiKey,
          },
        },
      ),
    );
    return response.data;
  }
}
