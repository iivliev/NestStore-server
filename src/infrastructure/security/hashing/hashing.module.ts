import { Module } from '@nestjs/common';
import { BcryptProvider } from './bcrypt.provider';
import { HashingProvider } from './hashing.provider';

@Module({
	providers: [
		{
			provide: HashingProvider,
			useClass: BcryptProvider,
		},
	],
	exports: [HashingProvider],
})
export class HashingModule {}
