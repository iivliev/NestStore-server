import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import databaseConfig from './config/database.config';
import validationSchema from './config/environment.validation';
import { TypeOrmModule } from '@nestjs/typeorm';

const ENV = process.env.NODE_ENV;

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: !ENV ? '.env' : `.env.${ENV}`,
			load: [databaseConfig],
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
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
