import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RoleGuard } from '../auth/role.guard';
import { UserRole } from '../enum/user-role.enum';
import { Roles } from './roles.docorator';

/**
 * JWT authentication은 Global Gaurd로 전역 설정
 */
export function Auth(roles: UserRole[]) {
  return applyDecorators(
    ApiBearerAuth('access_token'),
    Roles(roles),
    UseGuards(RoleGuard),
  );
}
