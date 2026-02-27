import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccessTokenGuard } from './guards/access-token/access-token.guard';
import jwtConfig from 'src/infrastructure/config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from './jwt/jwt.service';

@Module({
	imports: [JwtModule.registerAsync(jwtConfig.asProvider())],
	controllers: [AuthController],
	providers: [AuthService, JwtService, AccessTokenGuard],
	exports: [AuthService, AccessTokenGuard],
})
export class AuthModule {}
