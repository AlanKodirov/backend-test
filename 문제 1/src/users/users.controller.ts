import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/createUser.dto';
import { User } from 'src/typeorm/entities/User';
import { UserResponseDto } from './dtos/userResponse.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async registerUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return await this.usersService.registerUser(dto);
  }
}
