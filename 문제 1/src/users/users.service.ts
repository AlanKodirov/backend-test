import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dtos/createUser.dto';
import * as bcrypt from 'bcryptjs';
import { UserResponseDto } from './dtos/userResponse.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async registerUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const { name, email, password } = dto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.userRepository.save({
      name,
      email,
      password: hashedPassword,
    });

    const { password: _, ...user } = newUser;

    return user;
  }
}
