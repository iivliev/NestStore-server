import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import jwtConfig from 'src/infrastructure/config/jwt.config';
import { User } from 'src/users/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt.interface';

@Injectable()
export class JwtService {
	constructor(
		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,

		private readonly jwtService: NestJwtService,
	) {}

	async signToken<T>(userId: number, expiresIn: number, payload?: T) {
		return await this.jwtService.signAsync(
			{
				sub: userId,
				...payload,
			},
			{
				audience: this.jwtConfiguration.audience,
				issuer: this.jwtConfiguration.issuer,
				secret: this.jwtConfiguration.secret,
				expiresIn,
			},
		);
	}

	async generateTokens({ id: userId, email }: User) {
		const [accessToken, refreshToken] = await Promise.all([
			this.signToken<Partial<JwtPayload>>(userId, this.jwtConfiguration.accessTokenTtl, {
				email,
			}),
			this.signToken(userId, this.jwtConfiguration.refreshTokenTtl),
		]);

		return {
			accessToken,
			refreshToken,
		};
	}
}
