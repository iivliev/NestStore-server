import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccessTokenGuard } from './guards/access-token/access-token.guard';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from './jwt/jwt.service';
import { UsersModule } from 'src/users/users.module';
import { HashingModule } from 'src/infrastructure/security/hashing/hashing.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenCleanupService } from './jwt/refresh-token-cleanup-schedule.service';
import { RefreshTokenGuard } from './guards/refresh-token/refresh-token.guard';
import { AuthProvider } from './entities/auth-providers.entity';
import { ConfigModule } from '@nestjs/config';
import authConfig from './config/auth.config';
import { GoogleAuthService } from './providers/google/google.service';
import { GoogleController } from './providers/google/google.controller';

@Module({
	imports: [
		ConfigModule.forFeature(authConfig),
		JwtModule.register({}),
		TypeOrmModule.forFeature([AuthProvider, RefreshToken]),
		UsersModule,
		HashingModule,
	],
	controllers: [AuthController, GoogleController],
	providers: [
		AuthService,
		JwtService,
		AccessTokenGuard,
		RefreshTokenGuard,
		RefreshTokenCleanupService,
		GoogleAuthService,
	],
	exports: [AuthService, AccessTokenGuard],
})
export class AuthModule {}
