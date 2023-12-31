import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from './core/config/config.type';
import validationOptions from './utils/validation-options';
import { join } from 'path';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const options = new DocumentBuilder()
    .setTitle('Restful API - @waterbus.tech')
    .setDescription(
      'Waterbus: Online Meeting App using Flutter and WebRTC SFU (Selective Forwarding Unit)',
    )
    .setVersion('1.0')
    .addApiKey({
      type: 'apiKey',
    })
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  const authGrpcUrl = configService.getOrThrow('grpc.authUrl', { infer: true });
  const meetingGrpcUrl = configService.getOrThrow('grpc.meetingUrl', {
    infer: true,
  });

  const authMicroserviceOptions: MicroserviceOptions = {
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(__dirname, 'proto/auth.proto'),
      url: authGrpcUrl,
      loader: {
        json: true,
      },
    },
  };
  const meetingMicroserviceOptions: MicroserviceOptions = {
    transport: Transport.GRPC,
    options: {
      package: 'meeting',
      protoPath: join(__dirname, 'proto/meeting.proto'),
      url: meetingGrpcUrl,
      loader: {
        json: true,
      },
    },
  };

  app.connectMicroservice(authMicroserviceOptions);
  app.connectMicroservice(meetingMicroserviceOptions);

  await app.startAllMicroservices();

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
