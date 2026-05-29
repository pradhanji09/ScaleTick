import { userResponse } from './../Users/users.types';
import { loginResponse } from './auth.types';
import { userTransformer } from './../Users/users.transformer';
import { UsersService } from 'src/Users/users.service';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  InvalidCredentials,
  UserAlreadyExists,
  UserNotFound,
} from './auth.errors';

@Injectable()
export class AuthService {
  constructor(
    private readonly userServie: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(email: string, password: string): Promise<userResponse> {
    // Check Existing user with email
    const existingUser = await this.userServie.findByEmail(email);
    if (existingUser) throw UserAlreadyExists;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userServie.create(email, hashedPassword);

    return userTransformer.toRegisterResponse(user);
  }

  async loginUser(email: string, password: string): Promise<loginResponse> {
    const user = await this.userServie.findByEmail(email);
    if (!user) throw UserNotFound;

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) throw InvalidCredentials;

    const payload = {
      sub: user.id,
      email: user.email,
      is_admin: user.is_admin,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
