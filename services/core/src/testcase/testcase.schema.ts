import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TestcaseDocument = Testcase & Document & { _id: string };

@Schema({ timestamps: true })
export class Testcase {
  @Prop({ required: true })
  input: string;

  @Prop({ required: true })
  output: string;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  isPublic: boolean;
}

export const TestcaseSchema = SchemaFactory.createForClass(Testcase);
