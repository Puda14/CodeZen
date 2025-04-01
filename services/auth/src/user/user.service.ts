import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly authService: AuthService,
  ) { }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const { email, username, password } = dto;

    const existingUser = await this.userModel.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new ConflictException('Email or username already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({ email, username, password: hashedPassword });

    await user.save();

    return { message: 'User registered successfully' };
  }


  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = dto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password.');
    }

    const accessToken = this.authService.generateJwt(user._id.toString(), user.email);
    return { accessToken };
  }
}
