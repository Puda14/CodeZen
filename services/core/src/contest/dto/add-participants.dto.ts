import { IsArray, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AddParticipantsDto {
  @IsNotEmpty()
  @IsArray()
  @IsEmail({}, { each: true })
  emails: string[];
}
