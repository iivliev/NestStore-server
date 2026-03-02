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

@Module({
	imports: [JwtModule.register({}), TypeOrmModule.forFeature([RefreshToken]), UsersModule, HashingModule],
	controllers: [AuthController],
	providers: [AuthService, JwtService, AccessTokenGuard, RefreshTokenGuard, RefreshTokenCleanupService],
	exports: [AuthService, AccessTokenGuard],
})
export class AuthModule {}
