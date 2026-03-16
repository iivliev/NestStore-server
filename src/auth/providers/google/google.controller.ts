import { Get, Controller, Res, Query, Session, BadRequestException, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { GoogleAuthService } from './google.service';
import { type Response } from 'express';
import { UserAgent } from 'src/auth/decorators/user/user-agent.decorator';
import authConfig from 'src/auth/config/auth.config';
import { type ConfigType } from '@nestjs/config';
import appConfig from 'src/infrastructure/config/app.config';

@ApiTags('Google')
@Auth(AuthType.Public)
@Controller('google')
export class GoogleController {
	constructor(
		@Inject(authConfig.KEY)
		private readonly authConfiguration: ConfigType<typeof authConfig>,

		@Inject(appConfig.KEY)
		private readonly appConfiguration: ConfigType<typeof appConfig>,

		private readonly googleAuthService: GoogleAuthService,
	) {}

	@Get()
	googleAuth(@Res() res: Response, @Session() session: Record<string, any>) {
		const { url, state } = this.googleAuthService.generateGoogleAuthUrl();
		session.state = state;
		return res.redirect(url);
	}

	@Get('callback')
	async googleCallback(
		@Res() res: Response,
		@Query() query: Record<string, any>,
		@Session() session: Record<string, any>,
		@UserAgent() agent: string,
	) {
		if (query.error) {
			throw new BadRequestException(`Google OAuth error: ${query.error}`);
		}

		if (!query.code) {
			throw new BadRequestException('Authorization code not provided');
		}

		if (query.state !== session.state) {
			throw new BadRequestException('Invalid state parameter');
		}

		const { refreshToken } = await this.googleAuthService.handleGoogleCallback(agent, query.code as string);

		res.cookie(this.authConfiguration.refreshTokenCookieName, refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			path: this.authConfiguration.refreshTokenCookiePath,
			maxAge: this.authConfiguration.refreshTokenCookieAge,
		});
		return res.redirect(`${this.appConfiguration.clientUrl}/auth/success`);
	}
}
