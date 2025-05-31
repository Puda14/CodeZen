import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserDocument } from './user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from '../auth/auth.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly authService: AuthService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const { email, username, password } = dto;

    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    const baseUrl = this.configService.get<string>('APP_BASE_URL');
    if (!baseUrl) {
      throw new Error('APP_BASE_URL is not defined in environment variables');
    }

    const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify your email',
        template: 'verify',
        context: { url: verifyUrl },
      });
    } catch (error) {
      console.error('[SendMail Error]', error);
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }

    const user = new this.userModel({
      email,
      username,
      password: hashedPassword,
      isVerified: false,
      emailVerifyToken: token,
      emailVerifyTokenExpiry: expiry,
    });

    await user.save();

    return { message: 'Verification email sent. Please check your inbox.' };
  }

  async sendVerificationEmail(email: string, token: string, baseUrl: string) {
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your email',
      template: './verify', // templates/verify.hbs
      context: { url: verifyUrl },
    });
  }

  async verifyEmailToken(token: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      emailVerifyToken: token,
      emailVerifyTokenExpiry: { $gt: new Date() },
    });

    if (!user)
      throw new BadRequestException('Token is invalid or has expired.');

    user.isVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyTokenExpiry = null;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1h

    const baseUrl = this.configService.get<string>('APP_BASE_URL');
    if (!baseUrl) {
      throw new Error('APP_BASE_URL is not defined in environment variables');
    }

    const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Resend: Verify your email',
        template: 'verify',
        context: { url: verifyUrl },
      });
    } catch (err) {
      console.error('[SendMail Error]', err);
      throw new InternalServerErrorException('Failed to resend email');
    }

    user.emailVerifyToken = token;
    user.emailVerifyTokenExpiry = expiry;
    await user.save();

    return { message: 'Verification email resent. Please check your inbox.' };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = dto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password.');
    }

    const accessToken = this.authService.generateJwt(
      user._id.toString(),
      user.email,
    );
    return { accessToken };
  }
}
