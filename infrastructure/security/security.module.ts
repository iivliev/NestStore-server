import { Global, Module } from '@nestjs/common';
import { BcryptProvider } from './hashing/bcrypt.provider';
import { HashingProvider } from './hashing/hashing.provider';

@Global()
@Module({
	providers: [
		{
			provide: HashingProvider,
			useClass: BcryptProvider,
		},
	],
	exports: [HashingProvider],
})
export class SecurityModule {}
