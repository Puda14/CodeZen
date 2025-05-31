import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.userService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.userService.login(dto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.userService.verifyEmailToken(token);
  }

  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.userService.resendVerificationEmail(dto.email);
  }
}
