import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from './jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import { HashingProvider } from 'src/infrastructure/security/hashing/hashing.provider';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { User } from 'src/users/entities/user.entity';

describe('AuthService', () => {
	let service: AuthService;

	const mockJwtService = {
		generateTokens: jest.fn(),
		insertRefreshToken: jest.fn(),
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

		const mockUser: User = {
			id: 1,
			email: 'test@example.com',
			name: 'Test User',
			password: 'hashedPassword',
			confirmed: false,
			refreshTokens: [],
		};

		const mockTokens = {
			accessToken: 'access-token',
			refreshToken: 'refresh-token',
		};

		it('should sign in successfully with valid credentials', async () => {
			const agent = 'Mozilla/5.0';

			mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
			mockHashingProvider.compare.mockResolvedValue(true);
			mockJwtService.generateTokens.mockResolvedValue(mockTokens);
			mockJwtService.insertRefreshToken.mockResolvedValue(undefined);

			const result = await service.signIn(signInDto, agent);

			expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(signInDto.email);
			expect(mockHashingProvider.compare).toHaveBeenCalledWith(signInDto.password, mockUser.password);
			expect(mockJwtService.generateTokens).toHaveBeenCalledWith(mockUser);
			expect(mockJwtService.insertRefreshToken).toHaveBeenCalledWith({
				userId: mockUser.id,
				refreshToken: mockTokens.refreshToken,
				agent,
			});
			expect(result).toEqual(mockTokens);
		});

		it('should throw BadRequestException when user not found', async () => {
			mockUsersService.findOneByEmail.mockResolvedValue(null);

			await expect(service.signIn(signInDto, null)).rejects.toThrow(
				new BadRequestException(`User with email ${signInDto.email} not found`),
			);

			expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(signInDto.email);
			expect(mockHashingProvider.compare).not.toHaveBeenCalled();
			expect(mockJwtService.generateTokens).not.toHaveBeenCalled();
		});

		it('should throw BadRequestException when password is incorrect', async () => {
			mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
			mockHashingProvider.compare.mockResolvedValue(false);

			await expect(service.signIn(signInDto, null)).rejects.toThrow(new BadRequestException('Incorrect password'));

			expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(signInDto.email);
			expect(mockHashingProvider.compare).toHaveBeenCalledWith(signInDto.password, mockUser.password);
			expect(mockJwtService.generateTokens).not.toHaveBeenCalled();
		});

		it('should handle null agent parameter', async () => {
			mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
			mockHashingProvider.compare.mockResolvedValue(true);
			mockJwtService.generateTokens.mockResolvedValue(mockTokens);
			mockJwtService.insertRefreshToken.mockResolvedValue(undefined);

			const result = await service.signIn(signInDto, null);

			expect(mockJwtService.insertRefreshToken).toHaveBeenCalledWith({
				userId: mockUser.id,
				refreshToken: mockTokens.refreshToken,
				agent: null,
			});
			expect(result).toEqual(mockTokens);
		});
	});

	describe('signUp', () => {
		const signUpDto: SignUpUserDto = {
			email: 'newuser@example.com',
			name: 'New User',
			password: 'Password123',
		};

		const mockCreatedUser: User = {
			id: 2,
			email: 'newuser@example.com',
			name: 'New User',
			password: 'hashedPassword',
			confirmed: false,
			refreshTokens: [],
		};

		const mockTokens = {
			accessToken: 'new-access-token',
			refreshToken: 'new-refresh-token',
		};

		it('should sign up successfully with new user', async () => {
			const agent = 'Chrome';

			mockUsersService.findOneByEmail.mockResolvedValue(null);
			mockUsersService.create.mockResolvedValue(mockCreatedUser);
			mockJwtService.generateTokens.mockResolvedValue(mockTokens);
			mockJwtService.insertRefreshToken.mockResolvedValue(undefined);

			const result = await service.signUp(signUpDto, agent);

			expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(signUpDto.email);
			expect(mockUsersService.create).toHaveBeenCalledWith(signUpDto);
			expect(mockJwtService.generateTokens).toHaveBeenCalledWith({
				id: mockCreatedUser.id,
			});
			expect(mockJwtService.insertRefreshToken).toHaveBeenCalledWith({
				userId: mockCreatedUser.id,
				refreshToken: mockTokens.refreshToken,
				agent,
			});
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
			};

			mockUsersService.findOneByEmail.mockResolvedValue(existingUser);

			await expect(service.signUp(signUpDto, null)).rejects.toThrow(
				new BadRequestException(`User with email ${signUpDto.email} already exists`),
			);

			expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(signUpDto.email);
			expect(mockUsersService.create).not.toHaveBeenCalled();
			expect(mockJwtService.generateTokens).not.toHaveBeenCalled();
		});

		it('should handle null agent parameter', async () => {
			mockUsersService.findOneByEmail.mockResolvedValue(null);
			mockUsersService.create.mockResolvedValue(mockCreatedUser);
			mockJwtService.generateTokens.mockResolvedValue(mockTokens);
			mockJwtService.insertRefreshToken.mockResolvedValue(undefined);

			const result = await service.signUp(signUpDto, null);

			expect(mockJwtService.insertRefreshToken).toHaveBeenCalledWith({
				userId: mockCreatedUser.id,
				refreshToken: mockTokens.refreshToken,
				agent: null,
			});

			expect(result).toEqual(mockTokens);
		});

		it('should generate tokens', async () => {
			mockUsersService.findOneByEmail.mockResolvedValue(null);
			mockUsersService.create.mockResolvedValue(mockCreatedUser);
			mockJwtService.generateTokens.mockResolvedValue(mockTokens);
			mockJwtService.insertRefreshToken.mockResolvedValue(undefined);

			const result = await service.signUp(signUpDto, null);

			expect(mockJwtService.generateTokens).toHaveBeenCalledWith({
				id: mockCreatedUser.id,
			});

			expect(result).toEqual(mockTokens);
		});
	});

	describe('signOut', () => {
		it('should revoke refresh token successfully', async () => {
			const token = 'valid-refresh-token';

			mockJwtService.revokeRefreshToken.mockResolvedValue(undefined);

			await service.signOut(token);

			expect(mockJwtService.revokeRefreshToken).toHaveBeenCalledWith(token);
			expect(mockJwtService.revokeRefreshToken).toHaveBeenCalledTimes(1);
		});
	});
});
