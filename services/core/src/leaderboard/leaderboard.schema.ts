import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeaderboardDocument = Leaderboard & Document;

@Schema({ _id: false })
export class ProblemScore {
  @Prop({ required: true, type: String })
  p: string;

  @Prop({ required: true, type: String })
  problemId: string;

  @Prop({ required: true, type: Number })
  score: number;
}

export const ProblemScoreSchema = SchemaFactory.createForClass(ProblemScore);

@Schema({ _id: false })
export class LeaderboardUserInfo {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ required: true, type: String })
  username: string;

  @Prop({ required: true, type: String })
  email: string;
}

export const LeaderboardUserInfoSchema =
  SchemaFactory.createForClass(LeaderboardUserInfo);

@Schema({ _id: false })
export class LeaderboardUser {
  @Prop({ type: LeaderboardUserInfoSchema, required: true })
  user: LeaderboardUserInfo;

  @Prop({ type: Number, default: 0 })
  totalScore: number;

  @Prop({ type: [ProblemScoreSchema], default: [] })
  problems: ProblemScore[];
}

export const LeaderboardUserSchema =
  SchemaFactory.createForClass(LeaderboardUser);

@Schema({ timestamps: true })
export class Leaderboard {
  @Prop({ required: true, unique: true, type: String })
  contestId: string;

  @Prop({ type: [LeaderboardUserSchema], default: [] })
  users: LeaderboardUser[];
}

export const LeaderboardSchema = SchemaFactory.createForClass(Leaderboard);

LeaderboardSchema.index({ contestId: 1 });
