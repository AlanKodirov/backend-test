import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsNotEmpty,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @Length(8, 50, {
    message: 'Password must be at least 8 characters long',
  })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Password must contain both letters and numbers',
  })
  password: string;
}
