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
	};

	const mockNestJwtService = {
		signAsync: jest.fn(),
		decode: jest.fn(),
	};

	const mockUsersService = {
		findOneById: jest.fn(),
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
				userId: 1,
				expiresIn: 3600,
				secret: 'test-secret',
				payload: { email: 'test@example.com' },
			});

			expect(result).toBe(mockToken);
			expect(mockNestJwtService.signAsync).toHaveBeenCalledWith(
				{
					sub: 1,
					email: 'test@example.com',
				},
				{
					audience: mockJwtConfig.audience,
					issuer: mockJwtConfig.issuer,
					secret: 'test-secret',
					expiresIn: 3600,
				},
			);
		});

		it('should sign a token without additional payload', async () => {
			const mockToken = 'signed.jwt.token';
			mockNestJwtService.signAsync.mockResolvedValue(mockToken);

			const result = await service.signToken({
				userId: 1,
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
			const mockAccessToken = 'access.token';
			const mockRefreshToken = 'refresh.token';

			mockNestJwtService.signAsync.mockResolvedValueOnce(mockAccessToken).mockResolvedValueOnce(mockRefreshToken);

			const result = await service.generateTokens({
				id: 1,
				email: 'test@example.com',
			});

			expect(result).toEqual({
				accessToken: mockAccessToken,
				refreshToken: mockRefreshToken,
			});

			expect(mockNestJwtService.signAsync).toHaveBeenCalledTimes(2);
			expect(mockNestJwtService.signAsync).toHaveBeenNthCalledWith(
				1,
				{
					sub: 1,
					email: 'test@example.com',
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
			const mockRefreshToken = 'refresh.token';
			const mockDecodedToken = {
				sub: 1,
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 86400,
			};

			mockNestJwtService.decode.mockReturnValue(mockDecodedToken);
			mockRefreshTokenRepository.find.mockResolvedValue([]);

			await service.insertRefreshToken({
				user: mockUser,
				refreshToken: mockRefreshToken,
				agent: 'Mozilla/5.0',
			});

			expect(mockNestJwtService.decode).toHaveBeenCalledWith(mockRefreshToken);
			expect(mockRefreshTokenRepository.find).toHaveBeenCalledWith({
				where: { user: { id: mockUser.id }, revokedAt: IsNull() },
				order: { createdAt: 'ASC' },
			});
			expect(mockRefreshTokenRepository.insert).toHaveBeenCalledWith({
				user: mockUser,
				agent: 'Mozilla/5.0',
				refreshToken: mockRefreshToken,
				expiresAt: new Date(mockDecodedToken.exp * 1000),
			});
			expect(mockRefreshTokenRepository.delete).not.toHaveBeenCalled();
		});

		it('should delete oldest token when max active tokens limit is reached', async () => {
			const mockRefreshToken = 'refresh.token';
			const mockDecodedToken = {
				sub: 1,
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 86400,
			};

			const activeTokens = Array.from({ length: 5 }, (_, i) => ({
				id: i + 1,
				refreshToken: `token-${i}`,
				user: mockUser,
				agent: 'Mozilla/5.0',
				expiresAt: new Date(),
				createdAt: new Date(Date.now() - (5 - i) * 1000),
				revokedAt: null,
			}));

			mockNestJwtService.decode.mockReturnValue(mockDecodedToken);
			mockRefreshTokenRepository.find.mockResolvedValue(activeTokens);

			await service.insertRefreshToken({
				user: mockUser,
				refreshToken: mockRefreshToken,
				agent: 'Mozilla/5.0',
			});

			expect(mockRefreshTokenRepository.delete).toHaveBeenCalledWith(1);
			expect(mockRefreshTokenRepository.insert).toHaveBeenCalled();
		});

		it('should handle null agent', async () => {
			const mockRefreshToken = 'refresh.token';
			const mockDecodedToken = {
				sub: 1,
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 86400,
			};

			mockNestJwtService.decode.mockReturnValue(mockDecodedToken);
			mockRefreshTokenRepository.find.mockResolvedValue([]);

			await service.insertRefreshToken({
				user: mockUser,
				refreshToken: mockRefreshToken,
				agent: null,
			});

			expect(mockRefreshTokenRepository.insert).toHaveBeenCalledWith({
				user: mockUser,
				agent: null,
				refreshToken: mockRefreshToken,
				expiresAt: new Date(mockDecodedToken.exp * 1000),
			});
		});
	});

	describe('refreshTokens', () => {
		it('should refresh tokens for valid user', async () => {
			const mockAccessToken = 'new.access.token';
			const mockRefreshToken = 'new.refresh.token';

			mockUsersService.findOneById.mockResolvedValue(mockUser);
			mockNestJwtService.signAsync.mockResolvedValueOnce(mockAccessToken).mockResolvedValueOnce(mockRefreshToken);

			const result = await service.refreshTokens(1);

			expect(mockUsersService.findOneById).toHaveBeenCalledWith(1);
			expect(result).toEqual({
				accessToken: mockAccessToken,
				refreshToken: mockRefreshToken,
			});
		});

		it('should throw BadRequestException when user not found', async () => {
			mockUsersService.findOneById.mockResolvedValue(null);

			await expect(service.refreshTokens(999)).rejects.toThrow(BadRequestException);

			expect(mockUsersService.findOneById).toHaveBeenCalledWith(999);
		});
	});

	describe('revokeRefreshToken', () => {
		it('should revoke a valid refresh token', async () => {
			const mockRefreshToken = 'refresh.token';
			mockRefreshTokenRepository.update.mockResolvedValue({ affected: 1 });

			await service.revokeRefreshToken(mockRefreshToken);

			expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
				{ refreshToken: mockRefreshToken, revokedAt: IsNull() },
				{ revokedAt: expect.any(Date) as string },
			);
		});

		it('should throw BadRequestException when token not found', async () => {
			const mockRefreshToken = 'invalid.token';
			mockRefreshTokenRepository.update.mockResolvedValue({ affected: 0 });

			await expect(service.revokeRefreshToken(mockRefreshToken)).rejects.toThrow(BadRequestException);

			expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
				{ refreshToken: mockRefreshToken, revokedAt: IsNull() },
				{ revokedAt: expect.any(Date) as string },
			);
		});

		it('should throw BadRequestException when token already revoked', async () => {
			const mockRefreshToken = 'already.revoked.token';
			mockRefreshTokenRepository.update.mockResolvedValue({ affected: 0 });

			await expect(service.revokeRefreshToken(mockRefreshToken)).rejects.toThrow(BadRequestException);
		});
	});
});
