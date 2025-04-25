import { Controller, Post, Get, Delete, Patch, Param, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ContestService } from './contest.service';
import { ContestDto } from './dto/contest.dto';
import { Contest, ContestDocument } from './contest.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddParticipantsDto } from './dto/add-participants.dto';
import { UpdateContestDto } from './dto/update-contest.dto';
import { ProblemDto } from '../problem/dto/problem.dto';
import { TestcaseDto } from '../testcase/dto/testcase.dto';
import { UpdateProblemDto } from '../problem/dto/update-problem.dto';
import { Problem } from '../problem/problem.schema';
import { UpdateTestcaseDto } from '../testcase/dto/update-testcase.dto';
import { ContestStatus } from '../common/enums/contest.enum';
import { ContestPhase } from '../common/enums/contest.enum';
import { ContestStatusGuard } from './contest-status.guard';
import { ContestPhaseRequired } from './contest-phase.decorator';

@Controller('contest')
export class ContestController {
  constructor(private readonly contestService: ContestService) { }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createContest(@Body() contestDto: ContestDto, @Request() req: any): Promise<{ message: string; contestId?: string }> {
    const userId = req.user.userId;
    return this.contestService.createContest(contestDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteContest(@Param('id') contestId: string, @Request() req: any): Promise<{ message: string }> {
    const userId = req.user.userId;
    await this.contestService.deleteContest(contestId, userId);
    return { message: 'Contest deleted successfully' };
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard, ContestStatusGuard)
  @ContestPhaseRequired(ContestPhase.BEFORE_CONTEST)
  @HttpCode(HttpStatus.OK)
  async registerForContest(@Param('id') contestId: string, @Request() req: any): Promise<{ message: string }> {
    const userId = req.user.userId;
    await this.contestService.registerForContest(contestId, userId);
    return { message: 'Registration submitted successfully' };
  }

  @Delete(':id/register')
  @UseGuards(JwtAuthGuard, ContestStatusGuard)
  @ContestPhaseRequired(ContestPhase.BEFORE_CONTEST)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelContestRegistration(@Param('id') contestId: string, @Request() req: any): Promise<{ message: string }> {
    const userId = req.user.userId;
    await this.contestService.cancelRegistration(contestId, userId);
    return { message: 'Registration cancelled successfully' };
  }

  @Post(':id/registration/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateRegistrationStatus(
    @Param('id') contestId: string,
    @Param('userId') registeredUserId: string,
    @Body('status') status: string,
    @Request() req: any
  ): Promise<{ message: string }> {
    const ownerId = req.user.userId;
    await this.contestService.updateRegistrationStatus(contestId, registeredUserId, status, ownerId);
    return { message: `Registration ${status} successfully` };
  }

  @Get(':id/registrations')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getContestRegistrations(@Param('id') contestId: string, @Request() req: any): Promise<any> {
    const userId = req.user.userId;
    return this.contestService.getContestRegistrations(contestId, userId);
  }

  @Get(':id/details')
  @UseGuards(JwtAuthGuard, ContestStatusGuard)
  @ContestPhaseRequired(ContestPhase.DURING_CONTEST)
  async getContestDetails(@Param('id') contestId: string, @Request() req: any): Promise<ContestDocument> {
    const userId = req.user.userId;
    return this.contestService.getContestDetails(contestId, userId);
  }

  @Post(':id/add-participants')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async addParticipants(
    @Param('id') contestId: string,
    @Body() addParticipantsDto: AddParticipantsDto,
    @Request() req: any,
  ): Promise<{ results: { email: string; status: string; message?: string }[] }> {
    const userId = req.user.userId;
    return this.contestService.addParticipants(contestId, addParticipantsDto.emails, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateContest(
    @Param('id') contestId: string,
    @Body() updateContestDto: UpdateContestDto,
    @Request() req: any
  ): Promise<{ message: string }> {
    const userId = req.user.userId;
    await this.contestService.updateContest(contestId, updateContestDto, userId);
    return { message: 'Contest updated successfully' };
  }

  @Post(':id/problems')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async addProblemToContest(
    @Param('id') contestId: string,
    @Body() problemDto: ProblemDto,
    @Request() req: any
  ): Promise<{ message: string; problemId: string }> {
    const userId = req.user.userId;
    return this.contestService.addProblemToContest(contestId, problemDto, userId);
  }

  @Delete(':id/problems/:problemId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeProblemFromContest(
    @Param('id') contestId: string,
    @Param('problemId') problemId: string,
    @Request() req: any
  ): Promise<{ message: string }> {
    const userId = req.user.userId;
    await this.contestService.removeProblemFromContest(contestId, problemId, userId);
    return { message: 'Problem removed from contest successfully' };
  }

  @Post(':contestId/problems/:problemId/testcases')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async addTestcasesToProblem(
    @Param('contestId') contestId: string,
    @Param('problemId') problemId: string,
    @Body() testcasesDto: TestcaseDto[],
    @Request() req: any
  ): Promise<{ message: string; testcaseIds: string[] }> {
    const userId = req.user.userId;
    return this.contestService.addTestcasesToProblem(contestId, problemId, testcasesDto, userId);
  }

  @Delete(':contestId/problems/:problemId/testcases')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeTestcasesFromProblem(
    @Param('contestId') contestId: string,
    @Param('problemId') problemId: string,
    @Body() testcaseIds: string[],
    @Request() req: any
  ): Promise<{ message: string }> {
    const userId = req.user.userId;
    return this.contestService.removeTestcasesFromProblem(contestId, problemId, testcaseIds, userId);
  }

  @Patch(':contestId/problems/:problemId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProblem(
    @Param('contestId') contestId: string,
    @Param('problemId') problemId: string,
    @Body() updateProblemDto: UpdateProblemDto,
    @Request() req: any
  ): Promise<{ message: string }> {
    const userId = req.user.userId;
    await this.contestService.updateProblem(contestId, problemId, updateProblemDto, userId);
    return { message: 'Problem updated successfully' };
  }

  @Patch(':contestId/problems/:problemId/testcases')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateTestcases(
    @Param('contestId') contestId: string,
    @Param('problemId') problemId: string,
    @Body() testcasesToUpdate: UpdateTestcaseDto[],
    @Request() req: any
  ): Promise<{ message: string }> {
    const userId = req.user.userId;
    await this.contestService.updateTestcases(
      contestId,
      problemId,
      testcasesToUpdate,
      userId
    );
    return { message: 'Testcases updated successfully' };
  }

  @Get('status/:status')
  async getContestsByStatus(@Param('status') status: ContestStatus): Promise<Contest[]> {
    return this.contestService.getContestsByStatus(status);
  }

  @Get('registered')
  @UseGuards(JwtAuthGuard)
  async getRegisteredContests(@Request() req: any): Promise<Contest[]> {
    const userId = req.user.userId;
    return this.contestService.getRegisteredContests(userId);
  }

  @Get('owned')
  @UseGuards(JwtAuthGuard)
  async getOwnedContests(@Request() req: any): Promise<Contest[]> {
    const userId = req.user.userId;
    return this.contestService.getOwnedContests(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getContestBasicInfo(@Request() req: any, @Param('id') contestId: string): Promise<Partial<ContestDocument>> {
    const userId = req.user.userId;
    return this.contestService.getContestBasicInfo(contestId, userId);
  }

  @Get(":contestId/registration-status")
  @UseGuards(JwtAuthGuard)
  async getContestRegistrationStatus(
    @Param("contestId") contestId: string,
    @Request() req: any
  ): Promise<{ status: string }> {
    const userId = req.user.userId;
    return this.contestService.getContestRegistrationStatus(contestId, userId);
  }

  @Get(':contestId/problems/:problemId/contestant')
  @UseGuards(JwtAuthGuard, ContestStatusGuard)
  @ContestPhaseRequired(ContestPhase.DURING_CONTEST)
  async getProblemForContestant(
    @Param('contestId') contestId: string,
    @Param('problemId') problemId: string,
    @Request() req: any
  ): Promise<Problem> {
    const userId = req.user.userId;
    return this.contestService.getProblemForContestant(contestId, problemId, userId);
  }

  @Get(':contestId/problems/:problemId/owner')
  @UseGuards(JwtAuthGuard)
  async getProblemForOwner(
    @Param('contestId') contestId: string,
    @Param('problemId') problemId: string,
    @Request() req: any
  ): Promise<Problem> {
    const userId = req.user.userId;
    return this.contestService.getProblemForOwner(contestId, problemId, userId);
  }

  @Get(':contestId/owner')
  @UseGuards(JwtAuthGuard)
  async getContestForOwner(
    @Param('contestId') contestId: string,
    @Request() req: any
  ): Promise<Contest> {
    const userId = req.user.userId;
    return this.contestService.getContestForOwner(contestId, userId);
  }
}
