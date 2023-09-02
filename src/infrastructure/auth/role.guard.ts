import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enum/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.docorator';

function matchRoles(roles: UserRole[], userRoles: UserRole[]): boolean {
  return userRoles.some((userRole) => roles.includes(userRole));
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<UserRole[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();

    const requestRoles = request.user.roles;
    return matchRoles(roles, requestRoles);
  }
}
