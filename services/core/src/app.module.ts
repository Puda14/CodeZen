import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { MongooseConfigService } from './config/mongoose-config.service';
import { validationPipeConfig } from './config/validation.pipe.config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ContestModule } from './contest/contest.module';
import { ProblemModule } from './problem/problem.module';
import { TestcaseModule } from './testcase/testcase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),

    UserModule,

    AuthModule,

    ContestModule,

    ProblemModule,

    TestcaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
