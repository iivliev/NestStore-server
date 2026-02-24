import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.useGlobalPipes(
		new ValidationPipe({
			forbidNonWhitelisted: true,
			whitelist: true,
			transform: true,
		}),
	);

	const configService = app.get(ConfigService);

	const PORT = configService.get<string>('PORT') || 3000;

	await app.listen(PORT, () => {
		// eslint-disable-next-line no-console
		console.log(`Server is running on port ${PORT}`);
	});
}
bootstrap();
