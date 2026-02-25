import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import jwtConfig from 'src/infrastructure/config/jwt.config';

@Injectable()
export class JwtService {
	constructor(
		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,

		private readonly jwtService: JwtService,
	) {}
}
