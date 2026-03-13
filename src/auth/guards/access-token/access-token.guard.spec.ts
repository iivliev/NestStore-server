import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokenGuard } from './access-token.guard';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import authConfig from 'src/auth/config/auth.config';
import { REQUEST_USER_KEY } from 'src/auth/constants/auth.constants';
import { JwtPayload } from 'src/auth/interfaces/jwt.interface';

const ACCESS_TOKEN = 'test-access-token';
const JWT_PAYLOAD: JwtPayload = {
	sub: 123,
};

describe('AccessTokenGuard', () => {
	let guard: AccessTokenGuard;

	const mockJwtService = {
		verifyAsync: jest.fn(),
	};

	const mockAuthConfig = {
		jwtAccessTokenSecret: 'test-access-secret',
		jwtAudience: 'test-audience',
		jwtIssuer: 'test-issuer',
	};

	const mockRequest: { headers: { [key: string]: any }; [key: string]: any } = {
		headers: {},
	};

	const mockExecutionContext = {
		switchToHttp: jest.fn().mockReturnValue({
			getRequest: jest.fn().mockReturnValue(mockRequest),
		}),
	} as unknown as ExecutionContext;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AccessTokenGuard,
				{
					provide: NestJwtService,
					useValue: mockJwtService,
				},
				{
					provide: authConfig.KEY,
					useValue: mockAuthConfig,
				},
			],
		}).compile();

		guard = module.get<AccessTokenGuard>(AccessTokenGuard);

		jest.clearAllMocks();
		mockRequest.headers = {};
		delete mockRequest[REQUEST_USER_KEY];
	});

	describe('canActivate', () => {
		it('should return true when valid access token is present', async () => {
			mockRequest.headers.authorization = `Bearer ${ACCESS_TOKEN}`;
			mockJwtService.verifyAsync.mockResolvedValue(JWT_PAYLOAD);

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(ACCESS_TOKEN, {
				secret: mockAuthConfig.jwtAccessTokenSecret,
				audience: mockAuthConfig.jwtAudience,
				issuer: mockAuthConfig.jwtIssuer,
			});
		});

		it('should throw UnauthorizedException when authorization header is missing', async () => {
			mockRequest.headers = {};

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
			expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when token is missing from Bearer header', async () => {
			mockRequest.headers.authorization = 'Bearer';

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
			expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when Bearer keyword is missing', async () => {
			mockRequest.headers.authorization = 'some-token';

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
			expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when token verification fails', async () => {
			mockRequest.headers.authorization = 'Bearer invalid-token';
			mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
			expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('invalid-token', {
				secret: mockAuthConfig.jwtAccessTokenSecret,
				audience: mockAuthConfig.jwtAudience,
				issuer: mockAuthConfig.jwtIssuer,
			});
		});

		it('should attach user payload to request', async () => {
			mockRequest.headers.authorization = `Bearer ${ACCESS_TOKEN}`;
			mockJwtService.verifyAsync.mockResolvedValue(JWT_PAYLOAD);

			await guard.canActivate(mockExecutionContext);

			expect(mockRequest[REQUEST_USER_KEY]).toEqual(JWT_PAYLOAD);
		});

		it('should handle token verification with expired token', async () => {
			mockRequest.headers.authorization = `Bearer ${ACCESS_TOKEN}`;
			mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
		});

		it('should extract token correctly from Bearer authorization header', async () => {
			mockRequest.headers.authorization = `Bearer ${ACCESS_TOKEN}`;
			mockJwtService.verifyAsync.mockResolvedValue(JWT_PAYLOAD);

			await guard.canActivate(mockExecutionContext);

			expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(ACCESS_TOKEN, expect.any(Object));
		});

		it('should handle authorization header with extra spaces', async () => {
			mockRequest.headers.authorization = 'Bearer  ';

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
			expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
		});
	});
});
