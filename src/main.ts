// require('../.pnp.cjs').setup();

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import setUpSwagger from './infrastructure/swagger/set-up-swagger';
import { JwtAuthGuard } from './infrastructure/auth/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정: 랜딩페이지용
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // auth guard 전역 설정
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // swagger 설정
  setUpSwagger(app);

  await app.listen(8000);
  console.log(`app started on port 8000: ${process.env.NODE_ENV}`);
}

bootstrap();
