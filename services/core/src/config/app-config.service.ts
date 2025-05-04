import { Injectable } from '@nestjs/common';
import { AppConfig } from './app.config';

@Injectable()
export class AppConfigService {
  get problem() {
    return AppConfig.problem;
  }
}
