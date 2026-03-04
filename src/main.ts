import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.use(cookieParser());

	app.useGlobalPipes(
		new ValidationPipe({
			forbidNonWhitelisted: true,
			whitelist: true,
			transform: true,
		}),
	);

	const configService = app.get(ConfigService);

	app.enableCors({
		origin: configService.get<string>('CLIENT_URL'),
		credentials: true,
	});

	const PORT = configService.get<string>('PORT')!;

	await app.listen(PORT);
}
bootstrap();
