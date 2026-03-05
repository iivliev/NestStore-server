import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenCookieInterceptor } from './refresh-token-cookie.interceptor';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

interface TokenResponse {
	refreshToken?: string;
	accessToken?: string;
	clearRefreshToken?: boolean;
	[key: string]: unknown;
}

const ACCESS_TOKEN = 'test-access-token';
const REFRESH_TOKEN = 'test-refresh-token';
const REFRESH_TOKEN_COOKIE_NAME = 'testRefreshToken';
const REFRESH_TOKEN_COOKIE_PATH = '/auth';
const REFRESH_TOKEN_COOKIE_AGE = 604800000;

const CONFIG = {
	'jwt.refreshTokenCookieName': REFRESH_TOKEN_COOKIE_NAME,
	'jwt.refreshTokenCookiePath': REFRESH_TOKEN_COOKIE_PATH,
	'jwt.refreshTokenCookieAge': REFRESH_TOKEN_COOKIE_AGE,
	NODE_ENV: 'test',
};

const TOKEN_RESPONSE: TokenResponse = {
	refreshToken: REFRESH_TOKEN,
	accessToken: ACCESS_TOKEN,
	clearRefreshToken: false,
};

describe('RefreshTokenCookieInterceptor', () => {
	let interceptor: RefreshTokenCookieInterceptor;

	const mockConfigService = {
		get: jest.fn(),
	};

	const mockResponse = {
		cookie: jest.fn(),
		clearCookie: jest.fn(),
	};

	const mockExecutionContext = {
		switchToHttp: jest.fn().mockReturnValue({
			getResponse: jest.fn().mockReturnValue(mockResponse),
		}),
	} as unknown as ExecutionContext;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RefreshTokenCookieInterceptor,
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		interceptor = module.get<RefreshTokenCookieInterceptor>(RefreshTokenCookieInterceptor);

		mockConfigService.get.mockImplementation((key: string) => {
			const config: Record<string, string | number> = { ...CONFIG };

			return config[key];
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('intercept', () => {
		it('should set refresh token cookie when refreshToken is present', (done) => {
			const mockCallHandler: CallHandler<TokenResponse> = {
				handle: jest.fn().mockReturnValue(of(TOKEN_RESPONSE)),
			};

			interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
				next: (result) => {
					expect(mockResponse.cookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN, {
						httpOnly: true,
						secure: false,
						sameSite: 'strict',
						path: REFRESH_TOKEN_COOKIE_PATH,
						maxAge: REFRESH_TOKEN_COOKIE_AGE,
					});
					expect(result).toEqual({ accessToken: ACCESS_TOKEN });
					expect(result).not.toHaveProperty('refreshToken');
					done();
				},
			});
		});

		it('should set secure cookie in production environment', (done) => {
			mockConfigService.get.mockImplementation((key: string) => {
				const config: Record<string, string | number> = {
					...CONFIG,
					NODE_ENV: 'production',
				};
				return config[key];
			});

			const mockCallHandler: CallHandler<TokenResponse> = {
				handle: jest.fn().mockReturnValue(of(TOKEN_RESPONSE)),
			};

			interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
				next: (result) => {
					expect(mockResponse.cookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN, {
						httpOnly: true,
						secure: true,
						sameSite: 'strict',
						path: REFRESH_TOKEN_COOKIE_PATH,
						maxAge: REFRESH_TOKEN_COOKIE_AGE,
					});
					expect(result).toEqual({ accessToken: ACCESS_TOKEN });
					done();
				},
			});
		});

		it('should clear refresh token cookie when clearRefreshToken is true', (done) => {
			const mockData: TokenResponse = {
				clearRefreshToken: true,
				accessToken: ACCESS_TOKEN,
			};

			const mockCallHandler: CallHandler<TokenResponse> = {
				handle: jest.fn().mockReturnValue(of(mockData)),
			};

			interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
				next: (result) => {
					expect(mockResponse.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE_NAME, {
						path: REFRESH_TOKEN_COOKIE_PATH,
					});
					expect(result).toEqual({});
					done();
				},
			});
		});

		it('should handle both clearing and setting cookie', (done) => {
			const mockData: TokenResponse = {
				...TOKEN_RESPONSE,
				clearRefreshToken: true,
			};

			const mockCallHandler: CallHandler<TokenResponse> = {
				handle: jest.fn().mockReturnValue(of(mockData)),
			};

			interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
				next: (result) => {
					expect(mockResponse.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE_NAME, {
						path: REFRESH_TOKEN_COOKIE_PATH,
					});
					expect(mockResponse.cookie).not.toHaveBeenCalled();
					expect(result).toEqual({});
					done();
				},
			});
		});

		it('should return data unchanged when no refresh token operations', (done) => {
			const mockData: TokenResponse = {
				accessToken: ACCESS_TOKEN,
				user: { id: 1, email: 'test@example.com' },
			};

			const mockCallHandler: CallHandler<TokenResponse> = {
				handle: jest.fn().mockReturnValue(of(mockData)),
			};

			interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
				next: (result) => {
					expect(mockResponse.cookie).not.toHaveBeenCalled();
					expect(mockResponse.clearCookie).not.toHaveBeenCalled();
					expect(result).toEqual(mockData);
					done();
				},
			});
		});

		it('should handle null or undefined data', (done) => {
			const mockCallHandler: CallHandler<TokenResponse> = {
				handle: jest.fn().mockReturnValue(of(null)),
			};

			interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
				next: (result) => {
					expect(mockResponse.cookie).not.toHaveBeenCalled();
					expect(mockResponse.clearCookie).not.toHaveBeenCalled();
					expect(result).toBeNull();
					done();
				},
			});
		});
	});
});
