import { Module } from '@nestjs/common';
import { HashingModule } from './hashing/hashing.module';
import { JwtModule } from './jwt/jwt.module';

@Module({
	imports: [HashingModule, JwtModule],
	exports: [HashingModule, JwtModule],
})
export class SecurityModule {}
