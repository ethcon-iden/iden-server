import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/infrastructure/decorators/auth.decorator';
import { UserRole } from 'src/infrastructure/enum/user-role.enum';
import { CookieService } from './cookie.service';

@Controller('cookie')
@ApiTags('cookie')
export class CookieController {
  constructor(private readonly cookieService: CookieService) {}

  @Get('balance')
  @Auth([UserRole.USER])
  async getCookieBalance(@Req() req) {
    return await this.cookieService.getCookieBalance(req.user.id);
  }
}
