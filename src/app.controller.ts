import { Controller, Get } from '@nestjs/common';
import { Public } from './infrastructure/decorators/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('health')
  @Public()
  healthCheck(): string {
    return 'ok';
  }
}
