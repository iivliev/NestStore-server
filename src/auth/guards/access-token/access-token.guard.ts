import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { REQUEST_USER_KEY } from 'src/auth/constants/auth.constants';
import authConfig from 'src/auth/config/auth.config';
import { JwtPayload } from 'src/auth/interfaces/jwt.interface';

/**
 * AccessTokenGuard is responsible for validating the access token provided in the request headers.
 * It checks for the presence of the token, verifies its validity using the JwtService, and attaches the decoded payload to the request object
 * for further processing. If the token is missing or invalid, it throws an UnauthorizedException.
 *
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
	constructor(
		private readonly jwtService: NestJwtService,

		@Inject(authConfig.KEY)
		private readonly authConfiguration: ConfigType<typeof authConfig>,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>();

		const token = this.extractTokenFromRequestHeader(request);

		if (!token) {
			throw new UnauthorizedException();
		}

		try {
			const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
				secret: this.authConfiguration.jwtAccessTokenSecret,
				audience: this.authConfiguration.jwtAudience,
				issuer: this.authConfiguration.jwtIssuer,
			});
			request[REQUEST_USER_KEY] = payload;
		} catch {
			throw new UnauthorizedException();
		}
		return true;
	}

	private extractTokenFromRequestHeader(request: Request): string | undefined {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_, token] = request.headers.authorization?.split(' ') ?? [];

		return token;
	}
}
