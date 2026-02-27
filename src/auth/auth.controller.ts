import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthType } from './enums/auth-type.enum';
import { Auth } from './decorators/auth/auth.decorator';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { UserAgent } from './decorators/user-agend/user-agent.decorator';

@Auth(AuthType.Public)
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('sign-in')
	async signIn(@Body() signInDto: SignInUserDto, @UserAgent() agent: string) {
		return await this.authService.signIn(signInDto, agent);
	}

	@Post('sign-up')
	async signUp(@Body() signUpDto: SignUpUserDto, @UserAgent() agent: string) {
		return await this.authService.signUp(signUpDto, agent);
	}

	@Post('sign-out')
	async signOut() {
		return await this.authService.signOut();
	}

	@Post('refresh-tokens')
	async refreshTokens() {
		return await this.authService.refreshTokens();
	}

	@Auth(AuthType.Bearer)
	@Post('test')
	refreshTokensqwe() {}
}
