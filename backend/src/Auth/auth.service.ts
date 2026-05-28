import { UsersService } from 'src/Users/users.service';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userServie: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(email: string, password: string) {
    // Check Existing user with email
    const existingUser = await this.userServie.findByEmail(email);
    if (existingUser) throw new ConflictException();

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userServie.create(email, hashedPassword);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async loginUser(email: string, password: string) {
    const user = await this.userServie.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched)
      throw new UnauthorizedException('Invalid credentials');

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
