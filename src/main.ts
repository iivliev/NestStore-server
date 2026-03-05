import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createApp } from './app.create';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	createApp(app);
	await app.listen(PORT);
}
bootstrap();
