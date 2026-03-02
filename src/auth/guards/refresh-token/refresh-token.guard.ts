import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { REFRESH_TOKEN_KEY, REQUEST_USER_KEY } from 'src/auth/constants/auth.constants';
import jwtConfig from 'src/infrastructure/config/jwt.config';
import { JwtPayload } from 'src/auth/interfaces/jwt.interface';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
	constructor(
		private readonly jwtService: NestJwtService,

		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();

		const token = request.cookies[this.jwtConfiguration.refreshTokenCookieName] as string;

		if (!token) {
			throw new UnauthorizedException();
		}

		try {
			const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
				secret: this.jwtConfiguration.refreshTokenSecret,
				audience: this.jwtConfiguration.audience,
				issuer: this.jwtConfiguration.issuer,
			});

			request[REQUEST_USER_KEY] = payload;
			request[REFRESH_TOKEN_KEY] = token;
		} catch {
			throw new UnauthorizedException();
		}
		return true;
	}
}
