import { JwtPayload } from './../../Auth/strategies/jwt.strategy';
import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.getAllAndOverride<boolean>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No Role Decorator aded on route, it will give undefined
    if (requiredRole === undefined) return true;

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();

    if (requiredRole === true && !user.is_admin) return false;
    return true;
  }
}
