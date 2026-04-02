import { BadRequestException, Injectable } from '@nestjs/common';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { JwtService } from './jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import { HashingProvider } from 'src/infrastructure/security/hashing/hashing.provider';
import { AuthProvider } from './entities/auth-providers.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthProviderType } from './enums/auth-type.enum';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(AuthProvider)
		private readonly authProviderRepository: Repository<AuthProvider>,

		private readonly jwtService: JwtService,

		private readonly usersService: UsersService,

		private readonly hashingProvider: HashingProvider,
	) {}

	async signIn(signInDto: SignInUserDto, agent: string | null) {
		const existingUser = await this.usersService.findOneByEmail(signInDto.email);

		if (!existingUser) {
			throw new BadRequestException(`User with email ${signInDto.email} not found`);
		}

		if (!existingUser.password) {
			throw new BadRequestException('To sign in with email and password, password must be set.');
		}

		const isEqualPassword = await this.hashingProvider.compare(signInDto.password, existingUser.password);

		if (!isEqualPassword) {
			throw new BadRequestException(`Incorrect password`);
		}

		return this.jwtService.generateAndStoreTokens({
			userId: existingUser.id,
			agent,
			role: existingUser.role,
		});
	}

	async signUp(signUpDto: SignUpUserDto, agent: string | null) {
		const existingUser = await this.usersService.findOneByEmail(signUpDto.email);

		if (existingUser) {
			throw new BadRequestException(`User with email ${signUpDto.email} already exists`);
		}

		const hashedPassword = await this.hashingProvider.hash(signUpDto.password);

		const user = await this.usersService.create({ ...signUpDto, password: hashedPassword });

		return this.jwtService.generateAndStoreTokens({
			userId: user.id,
			agent,
			role: user.role,
		});
	}

	async signOut(userId: number, token: string) {
		await this.jwtService.revokeRefreshToken(userId, token);
	}

	async findAuthByProvider(provider: AuthProviderType, providerId: string) {
		return this.authProviderRepository.findOne({
			where: { provider, providerId },
			relations: ['user'],
		});
	}

	async createAuthProviderForUser(user: User, provider: AuthProviderType, providerId: string) {
		return this.authProviderRepository.save({ user, provider, providerId });
	}
}
