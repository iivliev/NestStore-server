import { Module } from '@nestjs/common';
import { JwtModule as JWT } from '@nestjs/jwt';
import jwtConfig from 'src/infrastructure/config/jwt.config';
import { JwtService } from './jwt.service';

@Module({
	imports: [JWT.registerAsync(jwtConfig.asProvider())],
	providers: [JwtService],
	exports: [JwtService],
})
export class JwtModule {}
