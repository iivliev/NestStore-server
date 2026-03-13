import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { REFRESH_TOKEN_KEY, REQUEST_USER_KEY } from 'src/auth/constants/auth.constants';
import authConfig from 'src/auth/config/auth.config';
import { JwtPayload } from 'src/auth/interfaces/jwt.interface';

/**
 * Is guard that validates the refresh token from the request cookies.
 * It checks for the presence of the refresh token, verifies its validity using the JwtService, and attaches the decoded payload to the request object
 * for further processing. If the token is missing or invalid, it throws an UnauthorizedException.
 *
 */
@Injectable()
export class RefreshTokenGuard implements CanActivate {
	constructor(
		private readonly jwtService: NestJwtService,

		@Inject(authConfig.KEY)
		private readonly authConfiguration: ConfigType<typeof authConfig>,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();

		const token = request.cookies[this.authConfiguration.refreshTokenCookieName] as string;

		if (!token.length) {
			throw new UnauthorizedException();
		}

		try {
			const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
				secret: this.authConfiguration.jwtRefreshTokenSecret,
				audience: this.authConfiguration.jwtAudience,
				issuer: this.authConfiguration.jwtIssuer,
			});

			request[REQUEST_USER_KEY] = payload;
			request[REFRESH_TOKEN_KEY] = token;
		} catch {
			throw new UnauthorizedException();
		}
		return true;
	}
}
