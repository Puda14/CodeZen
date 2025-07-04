import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) { }

  generateJwt(userId: string, email: string): string {
    return this.jwtService.sign({ _id: userId, email });
  }
}
