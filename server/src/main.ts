import 'reflect-metadata';
import { existsSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

  // Uma aplicação só (D01/D13): em produção o NestJS também serve o cliente compilado (client/dist).
  const clientDist = join(__dirname, '..', '..', 'client', 'dist');
  if (existsSync(join(clientDist, 'index.html'))) {
    app.useStaticAssets(clientDist);
    app.getHttpAdapter().getInstance().get(/^\/(?!api\/).*/, (_req: unknown, res: { sendFile: (p: string) => void }) => {
      res.sendFile(join(clientDist, 'index.html'));
    });
  }

  const porta = Number(process.env.PORT ?? 3000);
  await app.listen(porta);
  console.log(`Fio da Aprendizagem no ar: http://localhost:${porta}  (API em /api)`);
}
bootstrap();
