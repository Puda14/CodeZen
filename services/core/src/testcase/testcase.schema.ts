import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AppConfig } from '../config/app.config';

export type TestcaseDocument = Testcase & Document & { _id: string };

@Schema({ timestamps: true })
export class Testcase {
  @Prop({ required: true })
  input: string;

  @Prop({ required: true })
  output: string;

  @Prop({
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value',
    },
  })
  score: number;

  @Prop({
    type: Number,
    required: true,
    min: AppConfig.testcase.timeout.min,
    max: AppConfig.testcase.timeout.max,
    default: AppConfig.testcase.timeout.default,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value',
    },
  })
  timeout: number;

  @Prop({ required: true })
  isPublic: boolean;
}

export const TestcaseSchema = SchemaFactory.createForClass(Testcase);
