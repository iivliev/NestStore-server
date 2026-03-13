import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';

export const createApp = (app: INestApplication) => {
	const configService = app.get(ConfigService);

	app.use(cookieParser());

	app.useGlobalPipes(
		new ValidationPipe({
			forbidNonWhitelisted: true,
			whitelist: true,
			transform: true,
		}),
	);

	app.use(
		session({
			secret: configService.get<string>('SESSION_SECRET')!,
			resave: false,
			saveUninitialized: false,
			cookie: {
				httpOnly: true,
				secure: configService.get('NODE_ENV') === 'production',
				maxAge: configService.get<number>('SESSION_COOKIE_AGE'),
			},
		}),
	);

	if (configService.get('NODE_ENV') !== 'production') {
		const swaggerConfig = new DocumentBuilder()
			.setTitle('NestJS Shop API')
			.setDescription(
				'API documentation for the NestJS Shop application. This API allows you to manage products, categories, users, and orders in an e-commerce platform.',
			)
			.setVersion('1.0')
			.addBearerAuth(
				{
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
				'access-token',
			)
			.addCookieAuth('refreshToken')
			.build();

		const document = SwaggerModule.createDocument(app, swaggerConfig);
		SwaggerModule.setup('api', app, document);
	}

	app.enableCors({
		origin: configService.get<string>('CLIENT_URL'),
		credentials: true,
	});
};
