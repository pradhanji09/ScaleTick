import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  registerUser(@Body() body: RegisterDto) {
    return this.authService.registerUser(body.email, body.password);
  }

  @Public()
  @Post('login')
  loginUser(@Body() body: LoginDto) {
    return this.authService.loginUser(body.email, body.password);
  }
}
