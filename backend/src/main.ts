import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // OWASP: cabeceras de seguridad estándar (CSP, HSTS, X-Frame-Options,
  // X-Content-Type-Options, etc.) vía helmet, con valores por defecto
  // razonables para una API JSON (sin necesidad de servir HTML propio).
  app.use(helmet());

  const configService = app.get(ConfigService);
  const frontendUrl = configService.getOrThrow<string>('app.frontendUrl');

  // CORS restringido al origen del frontend configurado, no abierto a '*'.
  app.enableCors({
    origin: frontendUrl,
    methods: ['GET', 'POST'],
    credentials: false,
  });

  const documentConfig = new DocumentBuilder()
    .setTitle('Checkout Store API')
    .setDescription('API para el flujo de checkout de un producto.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, documentConfig);

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
  });

  const port = configService.getOrThrow<number>('app.port');

  await app.listen(port);
}

void bootstrap();
