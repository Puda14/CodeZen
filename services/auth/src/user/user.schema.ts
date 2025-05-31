import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document & { _id: string };

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: String, required: false, default: null })
  emailVerifyToken: string | null;

  @Prop({ type: Date, required: false, default: null })
  emailVerifyTokenExpiry: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
