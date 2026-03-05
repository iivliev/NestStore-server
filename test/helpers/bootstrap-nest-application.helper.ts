import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { INestApplication } from '@nestjs/common';
import { createApp } from 'src/app.create';

export async function bootstrapNestApplication(): Promise<INestApplication> {
	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [AppModule, ConfigModule],
		providers: [ConfigService],
	}).compile();

	const app: INestApplication = moduleFixture.createNestApplication();
	createApp(app);
	await app.init();
	return app;
}
