import { BadRequestException, Injectable } from '@nestjs/common';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { JwtService } from './jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import { HashingProvider } from 'src/infrastructure/security/hashing/hashing.provider';

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,

		private readonly usersService: UsersService,

		private readonly hashingProvider: HashingProvider,
	) {}

	async signIn(signInDto: SignInUserDto, agent: string | null) {
		const existingUser = await this.usersService.findOneByEmail(signInDto.email);

		if (!existingUser) {
			throw new BadRequestException(`User with email ${signInDto.email} not found`);
		}

		const isEqualPassword = await this.hashingProvider.compare(signInDto.password, existingUser.password);

		if (!isEqualPassword) {
			throw new BadRequestException(`Incorrect password`);
		}

		const { accessToken, refreshToken } = await this.jwtService.generateTokens(existingUser);
		await this.jwtService.insertRefreshToken({ user: existingUser, refreshToken, agent });

		return { accessToken, refreshToken };
	}

	async signUp(signUpDto: SignUpUserDto, agent: string | null) {
		const existingUser = await this.usersService.findOneByEmail(signUpDto.email);

		if (existingUser) {
			throw new BadRequestException(`User with email ${signUpDto.email} already exists`);
		}

		const user = await this.usersService.create(signUpDto);

		const { accessToken, refreshToken } = await this.jwtService.generateTokens({ id: user.id, email: user.email });

		await this.jwtService.insertRefreshToken({ user, refreshToken, agent });

		return { accessToken, refreshToken };
	}

	async signOut(token: string) {
		await this.jwtService.revokeRefreshToken(token);
	}

	async refreshTokens(refreshToken: string) {
		return await this.jwtService.refreshTokens(refreshToken);
	}
}
