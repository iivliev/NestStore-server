import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccessTokenGuard } from './guards/access-token/access-token.guard';
import jwtConfig from 'src/infrastructure/config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from './jwt/jwt.service';
import { UsersModule } from 'src/users/users.module';
import { HashingModule } from 'src/infrastructure/security/hashing/hashing.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

@Module({
	imports: [
		JwtModule.registerAsync(jwtConfig.asProvider()),
		TypeOrmModule.forFeature([RefreshToken]),
		UsersModule,
		HashingModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtService, AccessTokenGuard],
	exports: [AuthService, AccessTokenGuard],
})
export class AuthModule {}
