import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenGuard } from './refresh-token.guard';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import jwtConfig from 'src/infrastructure/config/jwt.config';
import { REQUEST_USER_KEY, REFRESH_TOKEN_KEY } from 'src/auth/constants/auth.constants';
import { JwtPayload } from 'src/auth/interfaces/jwt.interface';

const REFRESH_TOKEN = 'test-refresh-token';
const JWT_PAYLOAD: JwtPayload = {
	sub: 1,
};

describe('RefreshTokenGuard', () => {
	let guard: RefreshTokenGuard;

	const mockJwtService = {
		verifyAsync: jest.fn(),
	};

	const mockJwtConfig = {
		refreshTokenCookieName: 'testRefreshToken',
		refreshTokenSecret: 'test-refresh-secret',
		audience: 'test-audience',
		issuer: 'test-issuer',
	};

	const mockRequest = {
		cookies: {},
	};

	const mockExecutionContext = {
		switchToHttp: jest.fn().mockReturnValue({
			getRequest: jest.fn().mockReturnValue(mockRequest),
		}),
	} as unknown as ExecutionContext;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RefreshTokenGuard,
				{
					provide: NestJwtService,
					useValue: mockJwtService,
				},
				{
					provide: jwtConfig.KEY,
					useValue: mockJwtConfig,
				},
			],
		}).compile();

		guard = module.get<RefreshTokenGuard>(RefreshTokenGuard);

		jest.clearAllMocks();
		mockRequest.cookies = {};
		delete mockRequest[REQUEST_USER_KEY];
		delete mockRequest[REFRESH_TOKEN_KEY];
	});

	describe('canActivate', () => {
		it('should return true when valid refresh token is present', async () => {
			mockRequest.cookies[mockJwtConfig.refreshTokenCookieName] = REFRESH_TOKEN;
			mockJwtService.verifyAsync.mockResolvedValue(JWT_PAYLOAD);

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(REFRESH_TOKEN, {
				secret: mockJwtConfig.refreshTokenSecret,
				audience: mockJwtConfig.audience,
				issuer: mockJwtConfig.issuer,
			});
		});

		it('should throw UnauthorizedException when refresh token is missing', async () => {
			mockRequest.cookies = {};

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
			expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when refresh token is undefined', async () => {
			mockRequest.cookies[mockJwtConfig.refreshTokenCookieName] = undefined;

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
			expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when token verification fails', async () => {
			mockRequest.cookies[mockJwtConfig.refreshTokenCookieName] = 'invalid-token';
			mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
			expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('invalid-token', {
				secret: mockJwtConfig.refreshTokenSecret,
				audience: mockJwtConfig.audience,
				issuer: mockJwtConfig.issuer,
			});
		});

		it('should attach payload to request', async () => {
			mockRequest.cookies[mockJwtConfig.refreshTokenCookieName] = REFRESH_TOKEN;
			mockJwtService.verifyAsync.mockResolvedValue(JWT_PAYLOAD);

			await guard.canActivate(mockExecutionContext);

			expect(mockRequest[REQUEST_USER_KEY]).toEqual(JWT_PAYLOAD);
			expect(mockRequest[REFRESH_TOKEN_KEY]).toEqual(REFRESH_TOKEN);
		});

		it('should handle token verification with expired token', async () => {
			mockRequest.cookies[mockJwtConfig.refreshTokenCookieName] = 'expired-token';
			mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
		});
	});
});
