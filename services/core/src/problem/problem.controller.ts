import { Controller, Post, Get, Delete, Patch, Param, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProblemDto } from './dto/problem.dto';
import { ProblemService } from './problem.service';
import { UpdateProblemDto } from './dto/update-problem.dto';

@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) { }
}
