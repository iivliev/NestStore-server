import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import databaseConfig from './infrastructure/config/database.config';
import validationSchema from './infrastructure/config/environment.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityModule } from './infrastructure/security/security.module';
import { TypeOrmExceptionFilter } from 'src/infrastructure/database/filters/typeorm-exception.filter';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import appConfig from './infrastructure/config/app.config';
import { AuthenticationGuard } from './auth/guards/authentication/authentication.guard';
import { ScheduleModule } from '@nestjs/schedule';

const ENV = process.env.NODE_ENV;

@Module({
	imports: [
		ScheduleModule.forRoot(),
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: !ENV ? '.env' : `.env.${ENV}`,
			load: [appConfig, databaseConfig],
			validationSchema,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				type: 'postgres',
				host: configService.get('database.host'),
				port: configService.get('database.port'),
				username: configService.get('database.user'),
				password: configService.get('database.password'),
				database: configService.get('database.name'),
				autoLoadEntities: configService.get('database.autoLoadEntities'),
				synchronize: configService.get('database.synchronize'),
			}),
		}),
		AuthModule,
		UsersModule,
		SecurityModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_FILTER,
			useClass: TypeOrmExceptionFilter,
		},
		{
			provide: APP_GUARD,
			useClass: AuthenticationGuard,
		},
	],
})
export class AppModule {}
