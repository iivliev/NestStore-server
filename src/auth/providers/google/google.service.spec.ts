/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAuthService } from './google.service';
import authConfig from 'src/auth/config/auth.config';
import { UsersService } from 'src/users/users.service';
import { JwtService } from 'src/auth/jwt/jwt.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthProviderType } from 'src/auth/enums/auth-type.enum';

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
	OAuth2Client: jest.fn().mockImplementation(() => ({
		verifyIdToken: mockVerifyIdToken,
	})),
}));

describe('GoogleAuthService', () => {
	let service: GoogleAuthService;

	const mockConfig = {
		googleClientId: 'google-client-id',
		googleClientSecret: 'google-client-secret',
		googleRedirectUrl: 'https://example.com/callback',
		googleAuthUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
		googleTokenUrl: 'https://oauth2.googleapis.com/token',
		googleAuthScope: 'openid profile email',
	};

	const mockUsersService = {
		create: jest.fn(),
	};

	const mockJwtService = {
		generateAndStoreTokens: jest.fn(),
	};

	const mockAuthService = {
		findAuthByProvider: jest.fn(),
		createAuthProviderForUser: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GoogleAuthService,
				{
					provide: authConfig.KEY,
					useValue: mockConfig,
				},
				{
					provide: UsersService,
					useValue: mockUsersService,
				},
				{
					provide: JwtService,
					useValue: mockJwtService,
				},
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
			],
		}).compile();

		service = module.get<GoogleAuthService>(GoogleAuthService);
		service.onModuleInit();

		(global as any).fetch = jest.fn();
		mockVerifyIdToken.mockReset();
		jest.clearAllMocks();
	});

	afterEach(() => {
		delete (global as any).fetch;
	});

	describe('generateGoogleAuthUrl', () => {
		it('returns a url with the expected query params and state', () => {
			const result = service.generateGoogleAuthUrl();
			const url = new URL(result.url);

			expect(result.state).toMatch(/^[0-9a-f]{32}$/);
			expect(url.origin + url.pathname).toEqual(mockConfig.googleAuthUrl);
			expect(url.searchParams.get('client_id')).toEqual(mockConfig.googleClientId);
			expect(url.searchParams.get('redirect_uri')).toEqual(mockConfig.googleRedirectUrl);
			expect(url.searchParams.get('response_type')).toEqual('code');
			expect(url.searchParams.get('scope')).toEqual(mockConfig.googleAuthScope);
			expect(url.searchParams.get('prompt')).toEqual('consent');
			expect(url.searchParams.get('state')).toEqual(result.state);
		});
	});

	describe('exchangeCodeForTokens', () => {
		it('returns token response when the exchange succeeds', async () => {
			const tokenResponse = {
				access_token: 'at',
				expires_in: 3600,
				scope: 'openid email',
				token_type: 'Bearer',
				id_token: 'id-token',
			};

			(global as any).fetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue(tokenResponse),
			});

			const tokens = await (service as any).exchangeCodeForTokens('code-123');

			expect(tokens).toEqual(tokenResponse);
			expect(global.fetch).toHaveBeenCalledWith(
				mockConfig.googleTokenUrl,
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
				}),
			);
		});

		it('throws if the exchange returns non-ok response', async () => {
			(global as any).fetch.mockResolvedValue({
				ok: false,
				json: jest.fn().mockResolvedValue({ error_description: 'bad code' }),
			});

			await expect((service as any).exchangeCodeForTokens('code-123')).rejects.toThrow(
				'Failed to exchange code for tokens: bad code',
			);
		});

		it('throws if the token response is invalid', async () => {
			(global as any).fetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue({ access_token: 'at' }),
			});

			await expect((service as any).exchangeCodeForTokens('code-123')).rejects.toThrow(
				'Failed to parse Google token response',
			);
		});
	});

	describe('handleGoogleCallback', () => {
		const tokenResponse = {
			access_token: 'at',
			expires_in: 3600,
			scope: 'openid email',
			token_type: 'Bearer',
			id_token: 'id-token',
		};

		const payload = {
			sub: 'google-sub',
			email: 'test@example.com',
			name: 'Test User',
			picture: 'https://example.com/avatar.png',
			email_verified: true,
		};

		beforeEach(() => {
			(global as any).fetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue(tokenResponse),
			});
			mockVerifyIdToken.mockResolvedValue({
				getPayload: () => payload,
			});
		});

		it('uses existing auth and returns tokens', async () => {
			mockAuthService.findAuthByProvider.mockResolvedValue({ user: { id: 'existing-user-id' } });

			await service.handleGoogleCallback('agent', 'code');

			expect(mockJwtService.generateAndStoreTokens).toHaveBeenCalledWith({
				userId: 'existing-user-id',
				agent: 'agent',
			});
			expect(mockUsersService.create).not.toHaveBeenCalled();
			expect(mockAuthService.createAuthProviderForUser).not.toHaveBeenCalled();
		});

		it('creates user and returns tokens when no existing auth found', async () => {
			mockAuthService.findAuthByProvider.mockResolvedValue(null);
			mockUsersService.create.mockResolvedValue({ id: 'new-user-id' });

			await service.handleGoogleCallback('agent', 'code');

			expect(mockUsersService.create).toHaveBeenCalledWith({
				email: payload.email,
				name: payload.name,
				confirmed: payload.email_verified,
			});
			expect(mockAuthService.createAuthProviderForUser).toHaveBeenCalledWith(
				{ id: 'new-user-id' },
				AuthProviderType.GOOGLE,
				payload.sub,
			);
			expect(mockJwtService.generateAndStoreTokens).toHaveBeenCalledWith({
				userId: 'new-user-id',
				agent: 'agent',
			});
		});

		it('throws when google payload is invalid', async () => {
			mockVerifyIdToken.mockResolvedValue({
				getPayload: () => ({ email: 'no-sub@example.com' }),
			});

			await expect(service.handleGoogleCallback('agent', 'code')).rejects.toThrow('Failed to parse Google payload');
		});
	});
});
