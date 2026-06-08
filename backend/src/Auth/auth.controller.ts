import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Public()
  @Post('register')
  registerUser(@Body() body: RegisterDto) {
    return this.authService.registerUser(body.email, body.password);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Public()
  @Post('login')
  loginUser(@Body() body: LoginDto) {
    return this.authService.loginUser(body.email, body.password);
  }
}
