import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { map } from 'rxjs/operators';
import authConfig from 'src/auth/config/auth.config';
import { type ConfigType } from '@nestjs/config';

interface TokenResponse {
	refreshToken?: string;
	accessToken?: string;
	clearRefreshToken?: boolean;
}

/**
 * RefreshTokenCookieInterceptor is responsible for handling the refresh token in the response.
 * It checks if the response contains a refresh token or a flag to clear the refresh token cookie.
 *
 */
@Injectable()
export class RefreshTokenCookieInterceptor implements NestInterceptor<
	TokenResponse,
	Omit<TokenResponse, 'refreshToken' | 'clearRefreshToken'>
> {
	constructor(
		@Inject(authConfig.KEY)
		private readonly authConfiguration: ConfigType<typeof authConfig>,
	) {}

	intercept(context: ExecutionContext, next: CallHandler<TokenResponse>) {
		const response = context.switchToHttp().getResponse<Response>();

		return next.handle().pipe(
			map((data) => {
				if (!data) return data;

				const { refreshToken, clearRefreshToken, ...rest } = data;

				if (clearRefreshToken) {
					response.clearCookie(this.authConfiguration.refreshTokenCookieName, {
						path: this.authConfiguration.refreshTokenCookiePath,
					});
					return {};
				}

				if (refreshToken) {
					response.cookie(this.authConfiguration.refreshTokenCookieName, refreshToken, {
						httpOnly: true,
						secure: process.env.NODE_ENV === 'production',
						sameSite: 'strict',
						path: this.authConfiguration.refreshTokenCookiePath,
						maxAge: this.authConfiguration.refreshTokenCookieAge,
					});
				}

				return rest;
			}),
		);
	}
}
