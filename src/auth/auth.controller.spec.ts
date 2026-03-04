import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt/jwt.service';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { RefreshTokenGuard } from './guards/refresh-token/refresh-token.guard';
import { RefreshTokenCookieInterceptor } from './interceptors/refresh-token-cookie/refresh-token-cookie.interceptor';

describe('AuthController', () => {
	let controller: AuthController;

	const mockAuthService = {
		signIn: jest.fn(),
		signUp: jest.fn(),
		signOut: jest.fn(),
	};

	const mockJwtService = {
		refreshTokens: jest.fn(),
	};

	const mockRefreshTokenGuard = {
		canActivate: jest.fn(() => true),
	};

	const mockRefreshTokenCookieInterceptor = {
		intercept: jest.fn((context, next) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			return next.handle();
		}),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
				{
					provide: JwtService,
					useValue: mockJwtService,
				},
			],
		})
			.overrideGuard(RefreshTokenGuard)
			.useValue(mockRefreshTokenGuard)
			.overrideInterceptor(RefreshTokenCookieInterceptor)
			.useValue(mockRefreshTokenCookieInterceptor)
			.compile();

		controller = module.get<AuthController>(AuthController);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should sign in a user successfully', async () => {
		const signInDto: SignInUserDto = {
			email: 'test@example.com',
			password: 'Password123',
		};
		const userAgent = 'Mozilla/5.0';
		const expectedResult = {
			accessToken: 'access-token',
			refreshToken: 'refresh-token',
		};

		mockAuthService.signIn.mockResolvedValue(expectedResult);

		const result = await controller.signIn(signInDto, userAgent);

		expect(mockAuthService.signIn).toHaveBeenCalledWith(signInDto, userAgent);
		expect(mockAuthService.signIn).toHaveBeenCalledTimes(1);
		expect(result).toEqual(expectedResult);
	});

	it('should sign up a user successfully', async () => {
		const signUpDto: SignUpUserDto = {
			email: 'newuser@example.com',
			name: 'New User',
			password: 'Password123',
		};
		const userAgent = 'Mozilla/5.0';
		const expectedResult = {
			accessToken: 'access-token',
			refreshToken: 'refresh-token',
		};

		mockAuthService.signUp.mockResolvedValue(expectedResult);

		const result = await controller.signUp(signUpDto, userAgent);

		expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpDto, userAgent);
		expect(mockAuthService.signUp).toHaveBeenCalledTimes(1);
		expect(result).toEqual(expectedResult);
	});

	it('should sign out successfully and return clearRefreshToken flag', async () => {
		const refreshToken = 'valid-refresh-token';

		mockAuthService.signOut.mockResolvedValue(undefined);

		const result = await controller.signOut(refreshToken);

		expect(mockAuthService.signOut).toHaveBeenCalledWith(refreshToken);
		expect(mockAuthService.signOut).toHaveBeenCalledTimes(1);
		expect(result).toEqual({ clearRefreshToken: true });
	});

	it('should refresh tokens successfully', async () => {
		const userId = 1;
		const expectedResult = {
			accessToken: 'new-access-token',
			refreshToken: 'new-refresh-token',
		};

		mockJwtService.refreshTokens.mockResolvedValue(expectedResult);

		// Provide the required three arguments: userId, refreshToken, and userAgent
		const refreshToken = 'valid-refresh-token';
		const userAgent = 'Mozilla/5.0';
		const result = await controller.refreshTokens(userId, refreshToken, userAgent);

		expect(mockJwtService.refreshTokens).toHaveBeenCalledWith(userId, refreshToken, userAgent);
		expect(mockJwtService.refreshTokens).toHaveBeenCalledTimes(1);
		expect(result).toEqual(expectedResult);
	});
});
