import { Module } from '@nestjs/common';
import { HashingModule } from './hashing/hashing.module';

@Module({
	imports: [HashingModule],
	exports: [HashingModule],
})
export class SecurityModule {}
