import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from 'src/Auth/strategies/jwt.strategy';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
