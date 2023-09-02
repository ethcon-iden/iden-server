import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export default function setUpSwagger(app: INestApplication): void {
  const options = new DocumentBuilder()
    .setTitle('OMG API Docs')
    .setDescription(
      `## 환경 : ${process.env.NODE_ENV} \n\n ## S3 API Endpoint: ${process.env.AWS_S3_CLOUDFRONT_ENDPOINT}`,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access_token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('trinity/api-docs', app, document);
}
