import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-internal-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing internal API key');
    }

    const expectedKey = this.configService.get<string>('INTERNAL_API_KEY');
    if (apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    // Internal API key is valid
    req.isInternal = true; // optional
    return true;
  }
}
