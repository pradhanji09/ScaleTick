import { UsersService } from 'src/Users/users.service';
import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly userServie: UsersService) {}

  async register(email: string, password: string) {
    // Check Existing user with email
    const existingUser = await this.userServie.findByEmail(email);
    if (existingUser) throw new ConflictException();

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userServie.create(email, hashedPassword);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }
}
