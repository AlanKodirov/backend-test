import { IsString, IsEmail, IsDate } from 'class-validator';

export class UserResponseDto {
  @IsString()
  id: number;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsDate()
  createdAt: Date;
}
