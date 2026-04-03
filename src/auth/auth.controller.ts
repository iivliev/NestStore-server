import { Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthType } from './enums/auth-type.enum';
import { Auth } from './decorators/auth.decorator';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { UserAgent } from './decorators/user-agent.decorator';
import { RefreshTokenGuard } from './guards/refresh-token/refresh-token.guard';
import { RefreshToken } from './decorators/refresh-token.decorator';
import { RefreshTokenCookieInterceptor } from './interceptors/refresh-token-cookie/refresh-token-cookie.interceptor';
import { ActiveUser } from './decorators/active-user.decorator';
import { JwtService } from './jwt/jwt.service';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@UseInterceptors(RefreshTokenCookieInterceptor)
@Auth(AuthType.Public)
@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,

		private readonly jwtService: JwtService,
	) {}

	@Post('sign-in')
	@ApiOperation({ summary: 'User sign in' })
	@ApiResponse({ status: 200, description: 'User successfully signed in' })
	@ApiResponse({ status: 401, description: 'Invalid credentials' })
	async signIn(@Body() signInDto: SignInUserDto, @UserAgent() agent: string) {
		return await this.authService.signIn(signInDto, agent);
	}

	@Post('sign-up')
	@ApiOperation({ summary: 'User sign up' })
	@ApiResponse({ status: 201, description: 'User successfully signed up' })
	@ApiResponse({ status: 400, description: 'Invalid input' })
	async signUp(@Body() signUpDto: SignUpUserDto, @UserAgent() agent: string) {
		return await this.authService.signUp(signUpDto, agent);
	}

	@Post('sign-out')
	@UseGuards(RefreshTokenGuard)
	@ApiOperation({ summary: 'Sign out user' })
	@ApiCookieAuth('refreshToken')
	@ApiResponse({ status: 200, description: 'User logged out' })
	@ApiResponse({ status: 401, description: 'Invalid refresh token' })
	async signOut(@RefreshToken() token: string, @ActiveUser('sub') userId: number) {
		await this.authService.signOut(userId, token);
		return { clearRefreshToken: true };
	}

	@Post('refresh-tokens')
	@UseGuards(RefreshTokenGuard)
	@ApiOperation({ summary: 'Refresh access and refresh tokens' })
	@ApiCookieAuth('refreshToken')
	@ApiResponse({ status: 200, description: 'Tokens refreshed' })
	@ApiResponse({ status: 401, description: 'Invalid refresh token' })
	async refreshTokens(
		@ActiveUser('sub') userId: number,
		@RefreshToken() refreshToken: string,
		@UserAgent() agent: string,
	) {
		return await this.jwtService.refreshTokens({ userId, refreshToken, agent });
	}
}
