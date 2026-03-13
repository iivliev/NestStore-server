import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from './jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import { HashingProvider } from 'src/infrastructure/security/hashing/hashing.provider';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthProvider } from './entities/auth-providers.entity';
import { AuthProviderType } from './enums/auth-type.enum';

const mockTokens = {
	accessToken: 'access-token',
	refreshToken: 'refresh-token',
};

const user: User = {
	id: 1,
	email: 'test@example.com',
	name: 'Test User',
	password: 'hashedPassword',
	confirmed: false,
	refreshTokens: [],
	authProviders: [],
};

describe('AuthService', () => {
	let service: AuthService;

	const mockAuthProviderRepository = {
		save: jest.fn(),
		findOne: jest.fn(),
	};

	const mockJwtService = {
		generateAndStoreTokens: jest.fn(),
		revokeRefreshToken: jest.fn(),
	};

	const mockUsersService = {
		findOneByEmail: jest.fn(),
		create: jest.fn(),
	};

	const mockHashingProvider = {
		compare: jest.fn(),
		hash: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: JwtService,
					useValue: mockJwtService,
				},
				{
					provide: UsersService,
					useValue: mockUsersService,
				},
				{
					provide: HashingProvider,
					useValue: mockHashingProvider,
				},
				{
					provide: getRepositoryToken(AuthProvider),
					useValue: mockAuthProviderRepository,
				},
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('signIn', () => {
		const signInDto: SignInUserDto = {
			email: 'test@example.com',
			password: 'Password123',
		};

		it('should sign in successfully with valid credentials', async () => {
			const agent = 'Mozilla/5.0';

			mockUsersService.findOneByEmail.mockResolvedValue(user);
			mockHashingProvider.compare.mockResolvedValue(true);
			mockJwtService.generateAndStoreTokens.mockResolvedValue(mockTokens);

			const result = await service.signIn(signInDto, agent);

			expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(signInDto.email);
			expect(mockHashingProvider.compare).toHaveBeenCalledWith(signInDto.password, user.password);
			expect(mockJwtService.generateAndStoreTokens).toHaveBeenCalledWith(user.id, agent);
			expect(result).toEqual(mockTokens);
		});

		it('should throw BadRequestException when user not found', async () => {
			mockUsersService.findOneByEmail.mockResolvedValue(null);

			await expect(service.signIn(signInDto, null)).rejects.toThrow(
				new BadRequestException(`User with email ${signInDto.email} not found`),
			);

			expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(signInDto.email);
			expect(mockHashingProvider.compare).not.toHaveBeenCalled();
			expect(mockJwtService.generateAndStoreTokens).not.toHaveBeenCalled();
		});

		it('should throw BadRequestException when user does not have a password set', async () => {
			const userWithoutPassword: User = {
				...user,
				password: null,
			};

			mockUsersService.findOneByEmail.mockResolvedValue(userWithoutPassword);

			await expect(service.signIn(signInDto, null)).rejects.toThrow(
				new BadRequestException('To sign in with email and password, password must be set.'),
			);

			expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(signInDto.email);
			expect(mockHashingProvider.compare).not.toHaveBeenCalled();
			expect(mockJwtService.generateAndStoreTokens).not.toHaveBeenCalled();
		});

		it('should throw BadRequestException when password is incorrect', async () => {
			mockUsersService.findOneByEmail.mockResolvedValue(user);
			mockHashingProvider.compare.mockResolvedValue(false);

			await expect(service.signIn(signInDto, null)).rejects.toThrow(new BadRequestException('Incorrect password'));

			expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(signInDto.email);
			expect(mockHashingProvider.compare).toHaveBeenCalledWith(signInDto.password, user.password);
			expect(mockJwtService.generateAndStoreTokens).not.toHaveBeenCalled();
		});

		it('should handle null agent parameter', async () => {
			mockUsersService.findOneByEmail.mockResolvedValue(user);
			mockHashingProvider.compare.mockResolvedValue(true);
			mockJwtService.generateAndStoreTokens.mockResolvedValue(mockTokens);

			const result = await service.signIn(signInDto, null);

			expect(mockJwtService.generateAndStoreTokens).toHaveBeenCalledWith(user.id, null);
			expect(result).toEqual(mockTokens);
		});
	});

	describe('signUp', () => {
		const signUpDto: SignUpUserDto = {
			email: 'newuser@example.com',
			name: 'New User',
			password: 'Password123',
		};

		it('should sign up successfully with new user', async () => {
			const agent = 'Chrome';
			const hashedPassword = 'hashed-password';

			mockUsersService.findOneByEmail.mockResolvedValue(null);
			mockHashingProvider.hash.mockResolvedValue(hashedPassword);
			mockUsersService.create.mockResolvedValue(user);
			mockJwtService.generateAndStoreTokens.mockResolvedValue(mockTokens);

			const result = await service.signUp(signUpDto, agent);

			expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(signUpDto.email);
			expect(mockHashingProvider.hash).toHaveBeenCalledWith(signUpDto.password);
			expect(mockUsersService.create).toHaveBeenCalledWith({ ...signUpDto, password: hashedPassword });
			expect(mockJwtService.generateAndStoreTokens).toHaveBeenCalledWith(user.id, agent);
			expect(result).toEqual(mockTokens);
		});

		it('should throw BadRequestException when user already exists', async () => {
			const existingUser: User = {
				id: 1,
				email: signUpDto.email,
				name: 'Existing User',
				password: 'hashedPassword',
				confirmed: false,
				refreshTokens: [],
				authProviders: [],
			};

			mockUsersService.findOneByEmail.mockResolvedValue(existingUser);

			await expect(service.signUp(signUpDto, null)).rejects.toThrow(
				new BadRequestException(`User with email ${signUpDto.email} already exists`),
			);

			expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(signUpDto.email);
			expect(mockUsersService.create).not.toHaveBeenCalled();
			expect(mockJwtService.generateAndStoreTokens).not.toHaveBeenCalled();
		});

		it('should handle null agent parameter', async () => {
			const hashedPassword = 'hashed-password';

			mockUsersService.findOneByEmail.mockResolvedValue(null);
			mockHashingProvider.hash.mockResolvedValue(hashedPassword);
			mockUsersService.create.mockResolvedValue(user);
			mockJwtService.generateAndStoreTokens.mockResolvedValue(mockTokens);

			const result = await service.signUp(signUpDto, null);

			expect(mockJwtService.generateAndStoreTokens).toHaveBeenCalledWith(user.id, null);
			expect(result).toEqual(mockTokens);
		});

		it('should generate tokens', async () => {
			const hashedPassword = 'hashed-password';

			mockUsersService.findOneByEmail.mockResolvedValue(null);
			mockHashingProvider.hash.mockResolvedValue(hashedPassword);
			mockUsersService.create.mockResolvedValue(user);
			mockJwtService.generateAndStoreTokens.mockResolvedValue(mockTokens);

			const result = await service.signUp(signUpDto, null);

			expect(mockJwtService.generateAndStoreTokens).toHaveBeenCalledWith(user.id, null);
			expect(result).toEqual(mockTokens);
		});
	});

	describe('signOut', () => {
		it('should revoke refresh token successfully', async () => {
			const token = 'valid-refresh-token';
			const userId = 1;

			mockJwtService.revokeRefreshToken.mockResolvedValue(undefined);

			await service.signOut(userId, token);

			expect(mockJwtService.revokeRefreshToken).toHaveBeenCalledWith(userId, token);
			expect(mockJwtService.revokeRefreshToken).toHaveBeenCalledTimes(1);
		});
	});

	describe('findAuthByProvider', () => {
		it('should find auth provider by provider and providerId', async () => {
			const provider = AuthProviderType.GOOGLE;
			const providerId = '123456';
			const authProvider = { id: 1, provider, providerId, user };

			mockAuthProviderRepository.findOne.mockResolvedValue(authProvider);

			const result = await service.findAuthByProvider(provider, providerId);

			expect(mockAuthProviderRepository.findOne).toHaveBeenCalledWith({
				where: { provider, providerId },
				relations: ['user'],
			});
			expect(result).toEqual(authProvider);
		});

		it('should return null when auth provider not found', async () => {
			const provider = AuthProviderType.GOOGLE;
			const providerId = '123456';

			mockAuthProviderRepository.findOne.mockResolvedValue(null);

			const result = await service.findAuthByProvider(provider, providerId);

			expect(mockAuthProviderRepository.findOne).toHaveBeenCalledWith({
				where: { provider, providerId },
				relations: ['user'],
			});
			expect(result).toBeNull();
		});
	});

	describe('createAuthProviderForUser', () => {
		it('should create auth provider for user', async () => {
			const provider = AuthProviderType.GOOGLE;
			const providerId = '123456';
			const authProvider = { id: 1, provider, providerId, user };

			mockAuthProviderRepository.save.mockResolvedValue(authProvider);

			const result = await service.createAuthProviderForUser(user, provider, providerId);

			expect(mockAuthProviderRepository.save).toHaveBeenCalledWith({ user, provider, providerId });
			expect(result).toEqual(authProvider);
		});
	});
});
