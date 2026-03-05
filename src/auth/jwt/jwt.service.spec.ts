import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from './jwt.service';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { IsNull } from 'typeorm';
import jwtConfig from 'src/infrastructure/config/jwt.config';
import { UsersService } from 'src/users/users.service';
import { BadRequestException } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { HashingProvider } from 'src/infrastructure/security/hashing/hashing.provider';

const ACCESS_TOKEN = 'test-access-token';
const REFRESH_TOKEN = 'test-refresh-token';
const HASHED_TOKEN = 'hashed-token';
const DECODED_TOKEN = {
	sub: 1,
	iat: Math.floor(Date.now() / 1000),
	exp: Math.floor(Date.now() / 1000) + 86400,
};
const AGENT = 'Mozilla/5.0';

describe('JwtService', () => {
	let service: JwtService;

	const mockJwtConfig = {
		audience: 'test-audience',
		issuer: 'test-issuer',
		accessTokenSecret: 'access-secret',
		refreshTokenSecret: 'refresh-secret',
		accessTokenTtl: 3600,
		refreshTokenTtl: 86400,
		maxActiveTokens: 5,
	};

	const mockUser: User = {
		id: 1,
		email: 'test@example.com',
		password: 'hashed-password',
		refreshTokens: [],
		name: 'Test User',
		confirmed: false,
	};

	const mockRefreshTokenRepository = {
		find: jest.fn(),
		findOne: jest.fn(),
		insert: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		save: jest.fn(),
	};

	const mockNestJwtService = {
		signAsync: jest.fn(),
		decode: jest.fn(),
	};

	const mockUsersService = {
		findOneById: jest.fn(),
	};

	const mockHashingProvider = {
		hash: jest.fn(),
		compare: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				JwtService,
				{
					provide: getRepositoryToken(RefreshToken),
					useValue: mockRefreshTokenRepository,
				},
				{
					provide: jwtConfig.KEY,
					useValue: mockJwtConfig,
				},
				{
					provide: NestJwtService,
					useValue: mockNestJwtService,
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

		service = module.get<JwtService>(JwtService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('signToken', () => {
		it('should sign a token with the provided payload', async () => {
			const mockToken = 'signed.jwt.token';
			mockNestJwtService.signAsync.mockResolvedValue(mockToken);

			const result = await service.signToken({
				sub: 1,
				expiresIn: 3600,
				secret: 'test-secret',
			});

			expect(result).toBe(mockToken);
			expect(mockNestJwtService.signAsync).toHaveBeenCalledWith(
				{
					sub: 1,
				},
				{
					audience: mockJwtConfig.audience,
					issuer: mockJwtConfig.issuer,
					secret: 'test-secret',
					expiresIn: 3600,
				},
			);
		});
	});

	describe('generateTokens', () => {
		it('should generate both access and refresh tokens', async () => {
			mockNestJwtService.signAsync.mockResolvedValueOnce(ACCESS_TOKEN).mockResolvedValueOnce(REFRESH_TOKEN);

			const result = await service.generateTokens({
				id: 1,
			});

			expect(result).toEqual({
				accessToken: ACCESS_TOKEN,
				refreshToken: REFRESH_TOKEN,
			});

			expect(mockNestJwtService.signAsync).toHaveBeenCalledTimes(2);
			expect(mockNestJwtService.signAsync).toHaveBeenNthCalledWith(
				1,
				{
					sub: 1,
				},
				{
					audience: mockJwtConfig.audience,
					issuer: mockJwtConfig.issuer,
					secret: mockJwtConfig.accessTokenSecret,
					expiresIn: mockJwtConfig.accessTokenTtl,
				},
			);
			expect(mockNestJwtService.signAsync).toHaveBeenNthCalledWith(
				2,
				{
					sub: 1,
				},
				{
					audience: mockJwtConfig.audience,
					issuer: mockJwtConfig.issuer,
					secret: mockJwtConfig.refreshTokenSecret,
					expiresIn: mockJwtConfig.refreshTokenTtl,
				},
			);
		});
	});

	describe('insertRefreshToken', () => {
		it('should insert a refresh token successfully', async () => {
			mockNestJwtService.decode.mockReturnValue(DECODED_TOKEN);
			mockRefreshTokenRepository.find.mockResolvedValue([]);
			mockHashingProvider.hash.mockResolvedValue(HASHED_TOKEN);

			await service.insertRefreshToken({
				userId: mockUser.id,
				refreshToken: REFRESH_TOKEN,
				agent: 'Mozilla/5.0',
			});

			expect(mockNestJwtService.decode).toHaveBeenCalledWith(REFRESH_TOKEN);
			expect(mockRefreshTokenRepository.find).toHaveBeenCalledWith({
				where: { user: { id: mockUser.id }, revokedAt: IsNull() },
				order: { createdAt: 'ASC' },
			});
			expect(mockHashingProvider.hash).toHaveBeenCalledWith(REFRESH_TOKEN);
			expect(mockRefreshTokenRepository.insert).toHaveBeenCalledWith({
				user: { id: mockUser.id },
				agent: 'Mozilla/5.0',
				hashedToken: HASHED_TOKEN,
				expiresAt: new Date(DECODED_TOKEN.exp * 1000),
			});
			expect(mockRefreshTokenRepository.save).not.toHaveBeenCalled();
		});

		it('should revoke oldest token when max active tokens limit is reached', async () => {
			const activeTokens = Array.from({ length: 5 }, (_, i) => ({
				id: i + 1,
				hashedToken: `hashed-token-${i}`,
				user: mockUser,
				agent: 'Mozilla/5.0',
				expiresAt: new Date(),
				createdAt: new Date(Date.now() - (5 - i) * 1000),
				revokedAt: null,
			}));

			mockNestJwtService.decode.mockReturnValue(DECODED_TOKEN);
			mockRefreshTokenRepository.find.mockResolvedValue(activeTokens);
			mockHashingProvider.hash.mockResolvedValue(HASHED_TOKEN);

			await service.insertRefreshToken({
				userId: mockUser.id,
				refreshToken: REFRESH_TOKEN,
				agent: 'Mozilla/5.0',
			});

			expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith({
				...activeTokens[0],
				revokedAt: expect.any(Date) as Date,
			});
			expect(mockRefreshTokenRepository.insert).toHaveBeenCalled();
		});

		it('should handle null agent', async () => {
			mockNestJwtService.decode.mockReturnValue(DECODED_TOKEN);
			mockRefreshTokenRepository.find.mockResolvedValue([]);
			mockHashingProvider.hash.mockResolvedValue(HASHED_TOKEN);

			await service.insertRefreshToken({
				userId: mockUser.id,
				refreshToken: REFRESH_TOKEN,
				agent: null,
			});

			expect(mockRefreshTokenRepository.insert).toHaveBeenCalledWith({
				user: { id: mockUser.id },
				agent: null,
				hashedToken: HASHED_TOKEN,
				expiresAt: new Date(DECODED_TOKEN.exp * 1000),
			});
		});
	});

	describe('refreshTokens', () => {
		it('should refresh tokens and revoke old token', async () => {
			const mockOldRefreshToken = 'old.refresh.token';
			const mockNewRefreshToken = 'new.refresh.token';
			const mockHashedOldToken = 'hashed.old.token';

			const mockStoredToken = {
				id: 1,
				hashedToken: mockHashedOldToken,
				user: mockUser,
				agent: AGENT,
				expiresAt: new Date(),
				createdAt: new Date(),
				revokedAt: null,
			};

			mockRefreshTokenRepository.find.mockResolvedValue([mockStoredToken]);
			mockHashingProvider.compare.mockResolvedValue(true);
			mockRefreshTokenRepository.update.mockResolvedValue({ affected: 1 });
			mockNestJwtService.signAsync.mockResolvedValueOnce(ACCESS_TOKEN).mockResolvedValueOnce(mockNewRefreshToken);
			mockNestJwtService.decode.mockReturnValue(DECODED_TOKEN);
			mockHashingProvider.hash.mockResolvedValue(HASHED_TOKEN);

			const result = await service.refreshTokens(1, mockOldRefreshToken, AGENT);

			expect(mockHashingProvider.compare).toHaveBeenCalledWith(mockOldRefreshToken, mockHashedOldToken);
			expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
				{
					user: { id: 1 },
					hashedToken: mockHashedOldToken,
					revokedAt: IsNull(),
				},
				{ revokedAt: expect.any(Date) as string },
			);

			expect(mockNestJwtService.signAsync).toHaveBeenCalledTimes(2);

			expect(mockRefreshTokenRepository.insert).toHaveBeenCalledWith({
				user: { id: 1 },
				agent: AGENT,
				hashedToken: HASHED_TOKEN,
				expiresAt: new Date(DECODED_TOKEN.exp * 1000),
			});

			expect(result).toEqual({
				accessToken: ACCESS_TOKEN,
				refreshToken: mockNewRefreshToken,
			});
		});

		it('should throw UnauthorizedException when refresh token not found', async () => {
			const mockOldRefreshToken = 'invalid.token';

			mockRefreshTokenRepository.find.mockResolvedValue([]);

			await expect(service.refreshTokens(1, mockOldRefreshToken, AGENT)).rejects.toThrow(
				'Refresh token not found or already revoked',
			);

			expect(mockRefreshTokenRepository.find).toHaveBeenCalledWith({
				where: { user: { id: 1 }, revokedAt: IsNull() },
				order: { createdAt: 'ASC' },
			});

			expect(mockNestJwtService.signAsync).not.toHaveBeenCalled();
			expect(mockRefreshTokenRepository.insert).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when token already revoked', async () => {
			const mockOldRefreshToken = 'revoked.token';
			const mockHashedOldToken = 'hashed.revoked.token';

			const mockStoredToken = {
				id: 1,
				hashedToken: mockHashedOldToken,
				user: mockUser,
				agent: AGENT,
				expiresAt: new Date(),
				createdAt: new Date(),
				revokedAt: null,
			};

			mockRefreshTokenRepository.find.mockResolvedValue([mockStoredToken]);
			mockHashingProvider.compare.mockResolvedValue(true);
			mockRefreshTokenRepository.update.mockResolvedValue({ affected: 0 });

			await expect(service.refreshTokens(999, mockOldRefreshToken, AGENT)).rejects.toThrow(
				'Refresh token not found or already revoked',
			);
		});
	});

	describe('revokeRefreshToken', () => {
		it('should revoke a refresh token', async () => {
			const mockUserId = 1;

			const mockStoredToken = {
				id: 1,
				hashedToken: HASHED_TOKEN,
				user: mockUser,
				agent: AGENT,
				expiresAt: new Date(),
				createdAt: new Date(),
				revokedAt: null,
			};

			mockRefreshTokenRepository.find.mockResolvedValue([mockStoredToken]);
			mockHashingProvider.compare.mockResolvedValue(true);
			mockRefreshTokenRepository.update.mockResolvedValue({ affected: 1 });

			await service.revokeRefreshToken(mockUserId, REFRESH_TOKEN);

			expect(mockHashingProvider.compare).toHaveBeenCalledWith(REFRESH_TOKEN, HASHED_TOKEN);
			expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
				{ user: { id: mockUserId }, hashedToken: HASHED_TOKEN, revokedAt: IsNull() },
				{ revokedAt: expect.any(Date) as string },
			);
		});

		it('should throw UnauthorizedException when token not found', async () => {
			const mockRefreshToken = 'invalid.token';
			const mockUserId = 1;

			mockRefreshTokenRepository.find.mockResolvedValue([]);

			await expect(service.revokeRefreshToken(mockUserId, mockRefreshToken)).rejects.toThrow(
				'Refresh token not found or already revoked',
			);

			expect(mockRefreshTokenRepository.find).toHaveBeenCalledWith({
				where: { user: { id: mockUserId }, revokedAt: IsNull() },
				order: { createdAt: 'ASC' },
			});
		});

		it('should throw BadRequestException when token update fails', async () => {
			const mockRefreshToken = 'already.revoked.token';
			const mockUserId = 1;

			const mockStoredToken = {
				id: 1,
				hashedToken: HASHED_TOKEN,
				user: mockUser,
				agent: AGENT,
				expiresAt: new Date(),
				createdAt: new Date(),
				revokedAt: null,
			};

			mockRefreshTokenRepository.find.mockResolvedValue([mockStoredToken]);
			mockHashingProvider.compare.mockResolvedValue(true);
			mockRefreshTokenRepository.update.mockResolvedValue({ affected: 0 });

			await expect(service.revokeRefreshToken(mockUserId, mockRefreshToken)).rejects.toThrow(BadRequestException);
		});
	});
});
