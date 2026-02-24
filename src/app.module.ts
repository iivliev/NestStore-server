import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './config/database.config';
import validationSchema from './config/environment.validation';

const ENV = process.env.NODE_ENV;

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: !ENV ? '.env' : `.env.${ENV}`,
			load: [databaseConfig],
			validationSchema,
		}),
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
