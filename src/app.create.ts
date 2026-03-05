import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

export const createApp = (app: INestApplication) => {
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
};
