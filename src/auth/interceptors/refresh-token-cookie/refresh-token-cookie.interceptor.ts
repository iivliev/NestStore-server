import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { map } from 'rxjs/operators';

interface TokenResponse {
	refreshToken?: string;
	accessToken?: string;
	clearRefreshToken?: boolean;
}

@Injectable()
export class RefreshTokenCookieInterceptor implements NestInterceptor<
	TokenResponse,
	Omit<TokenResponse, 'refreshToken' | 'clearRefreshToken'>
> {
	constructor(private configService: ConfigService) {}

	intercept(context: ExecutionContext, next: CallHandler<TokenResponse>) {
		const response = context.switchToHttp().getResponse<Response>();

		return next.handle().pipe(
			map((data) => {
				if (!data) return data;

				const { refreshToken, clearRefreshToken, ...rest } = data;

				if (clearRefreshToken) {
					response.clearCookie(this.configService.get<string>('jwt.refreshTokenCookieName')!, {
						path: this.configService.get<string>('jwt.refreshTokenCookiePath'),
					});
					return {};
				}

				if (refreshToken) {
					response.cookie(this.configService.get<string>('jwt.refreshTokenCookieName')!, refreshToken, {
						httpOnly: true,
						secure: this.configService.get<string>('NODE_ENV') === 'production' ? true : false,
						sameSite: 'strict',
						path: this.configService.get<string>('jwt.refreshTokenCookiePath'),
						maxAge: this.configService.get<number>('jwt.refreshTokenCookieAge'),
					});
				}

				return rest;
			}),
		);
	}
}
