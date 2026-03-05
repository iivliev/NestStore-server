import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt/jwt.service';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { RefreshTokenGuard } from './guards/refresh-token/refresh-token.guard';
import { RefreshTokenCookieInterceptor } from './interceptors/refresh-token-cookie/refresh-token-cookie.interceptor';

const AGENT = 'Mozilla/5.0';
const SIGN_IN_DTO: SignInUserDto = {
	email: 'test@example.com',
	password: 'Password123',
};
const SIGN_UP_DTO: SignUpUserDto = {
	email: 'newuser@example.com',
	name: 'New User',
	password: 'Password123',
};
const ENDPOINT_RESPONSE = {
	accessToken: 'access-token',
	refreshToken: 'refresh-token',
};

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
		mockAuthService.signIn.mockResolvedValue(ENDPOINT_RESPONSE);

		const result = await controller.signIn(SIGN_IN_DTO, AGENT);

		expect(mockAuthService.signIn).toHaveBeenCalledWith(SIGN_IN_DTO, AGENT);
		expect(mockAuthService.signIn).toHaveBeenCalledTimes(1);
		expect(result).toEqual(ENDPOINT_RESPONSE);
	});

	it('should sign up a user successfully', async () => {
		mockAuthService.signUp.mockResolvedValue(ENDPOINT_RESPONSE);

		const result = await controller.signUp(SIGN_UP_DTO, AGENT);

		expect(mockAuthService.signUp).toHaveBeenCalledWith(SIGN_UP_DTO, AGENT);
		expect(mockAuthService.signUp).toHaveBeenCalledTimes(1);
		expect(result).toEqual(ENDPOINT_RESPONSE);
	});

	it('should sign out successfully and return clearRefreshToken flag', async () => {
		const refreshToken = 'valid-refresh-token';
		const userId = 1;

		mockAuthService.signOut.mockResolvedValue(undefined);

		const result = await controller.signOut(refreshToken, userId);

		expect(mockAuthService.signOut).toHaveBeenCalledWith(userId, refreshToken);
		expect(mockAuthService.signOut).toHaveBeenCalledTimes(1);
		expect(result).toEqual({ clearRefreshToken: true });
	});

	it('should refresh tokens successfully', async () => {
		const userId = 1;

		mockJwtService.refreshTokens.mockResolvedValue(ENDPOINT_RESPONSE);

		const refreshToken = 'valid-refresh-token';
		const result = await controller.refreshTokens(userId, refreshToken, AGENT);

		expect(mockJwtService.refreshTokens).toHaveBeenCalledWith(userId, refreshToken, AGENT);
		expect(mockJwtService.refreshTokens).toHaveBeenCalledTimes(1);
		expect(result).toEqual(ENDPOINT_RESPONSE);
	});
});
