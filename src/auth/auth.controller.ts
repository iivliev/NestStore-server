import { Body, Controller, Post, Res, Inject, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthType } from './enums/auth-type.enum';
import { Auth } from './decorators/auth/auth.decorator';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { UserAgent } from './decorators/user-agend/user-agent.decorator';
import { type Request, type Response } from 'express';
import jwtConfig from 'src/infrastructure/config/jwt.config';
import { type ConfigType } from '@nestjs/config';
import { RefreshTokenGuard } from './guards/refresh-token/refresh-token.guard';
import { RefreshToken } from './decorators/jwt/refresh-token.decorator';

@Auth(AuthType.Public)
@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,

		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
	) {}

	@Post('sign-in')
	async signIn(
		@Res({ passthrough: true }) response: Response,
		@Body() signInDto: SignInUserDto,
		@UserAgent() agent: string,
	) {
		const { accessToken, refreshToken } = await this.authService.signIn(signInDto, agent);

		response.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});
		return { accessToken };
	}

	@Post('sign-up')
	async signUp(
		@Res({ passthrough: true }) response: Response,
		@Body() signUpDto: SignUpUserDto,
		@UserAgent() agent: string,
	) {
		const { accessToken, refreshToken } = await this.authService.signUp(signUpDto, agent);
		response.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});
		return { accessToken };
	}

	@UseGuards(RefreshTokenGuard)
	@Post('sign-out')
	async signOut(@Res({ passthrough: true }) response: Response, @RefreshToken() token: string) {
		response.clearCookie('refreshToken', { path: '/' });
		return await this.authService.signOut(token);
	}

	@UseGuards(RefreshTokenGuard)
	@Post('refresh-tokens')
	async refreshTokens(@Res({ passthrough: true }) response: Response, @RefreshToken() token: string) {
		const { accessToken, refreshToken } = await this.authService.refreshTokens(token);
		response.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});
		return { accessToken };
	}
}
