import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SubmissionStatus } from '../common/enums/submission.enum';

export type SubmissionDocument = Submission & Document & { _id: string };

@Schema({ timestamps: true })
export class Submission {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Contest', required: true })
  contest: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Problem', required: true })
  problem: Types.ObjectId;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  language: string;

  @Prop({ required: true })
  score: number;

  @Prop({
    type: [
      {
        test_case: String,
        status: String,
        output: String,
        expected: String,
        score: Number,
        error_message: String,
        execution_time: Number,
        exit_code: Number,
      },
    ],
    default: [],
  })
  testcaseResults: {
    test_case: string;
    status: string;
    output: string;
    expected?: string;
    score: number;
    error_message?: string;
    execution_time?: number;
    exit_code?: number;
  }[];

  @Prop({ required: true })
  attemptNumber: number;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
