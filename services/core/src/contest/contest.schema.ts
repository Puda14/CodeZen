import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../user/user.schema';
import {
  ContestStatus,
  LeaderboardStatus,
  RegistrationStatus,
} from '../common/enums/contest.enum';

export type ContestDocument = Contest & Document & { _id: string };

@Schema({ timestamps: true })
export class Contest {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  start_time: Date;

  @Prop({ required: true })
  end_time: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  owner: Types.ObjectId | User;

  @Prop({ required: true, enum: ContestStatus })
  status: ContestStatus;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  isPublic: boolean;

  @Prop({
    required: true,
    enum: LeaderboardStatus,
    default: LeaderboardStatus.OPEN,
  })
  leaderboardStatus: LeaderboardStatus;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Problem' }], default: [] })
  problems: Types.ObjectId[];

  @Prop({
    type: [
      {
        user: { type: Types.ObjectId, ref: 'User' },
        status: { type: String, enum: RegistrationStatus, default: 'pending' },
      },
    ],
    default: [],
  })
  registrations: {
    user: Types.ObjectId | User;
    status: string;
  }[];
}

export const ContestSchema = SchemaFactory.createForClass(Contest);
