import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Difficulty } from '../common/enums/difficulty.enum';
import { Tags } from '../common/enums/tags.enum';
import { Testcase } from '../testcase/testcase.schema';
import mongoose from 'mongoose';

export type ProblemDocument = Problem & Document & { _id: string };

@Schema({ timestamps: true })
export class Problem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: Difficulty })
  difficulty: Difficulty;

  @Prop({ type: [String], enum: Object.values(Tags), default: [] })
  tags: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Testcase' }], default: [] })
  testcases: Types.ObjectId[];
}

export const ProblemSchema = SchemaFactory.createForClass(Problem);
