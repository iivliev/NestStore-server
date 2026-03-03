import { Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthType } from './enums/auth-type.enum';
import { Auth } from './decorators/auth/auth.decorator';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { UserAgent } from './decorators/user/user-agent.decorator';
import { RefreshTokenGuard } from './guards/refresh-token/refresh-token.guard';
import { RefreshToken } from './decorators/auth/refresh-token.decorator';
import { RefreshTokenCookieInterceptor } from './interceptors/refresh-token-cookie.interceptor';
import { ActiveUser } from './decorators/user/active-user.decorator';
import { JwtService } from './jwt/jwt.service';

@UseInterceptors(RefreshTokenCookieInterceptor)
@Auth(AuthType.Public)
@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,

		private readonly jwtService: JwtService,
	) {}

	@Post('sign-in')
	async signIn(@Body() signInDto: SignInUserDto, @UserAgent() agent: string) {
		return await this.authService.signIn(signInDto, agent);
	}

	@Post('sign-up')
	async signUp(@Body() signUpDto: SignUpUserDto, @UserAgent() agent: string) {
		return await this.authService.signUp(signUpDto, agent);
	}

	@UseGuards(RefreshTokenGuard)
	@Post('sign-out')
	async signOut(@RefreshToken() token: string) {
		await this.authService.signOut(token);
		return { clearRefreshToken: true };
	}

	@UseGuards(RefreshTokenGuard)
	@Post('refresh-tokens')
	async refreshTokens(@ActiveUser('sub') userId: number) {
		return await this.jwtService.refreshTokens(userId);
	}
}
