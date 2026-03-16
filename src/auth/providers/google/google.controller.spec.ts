/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { GoogleController } from './google.controller';
import { GoogleAuthService } from './google.service';
import authConfig from 'src/auth/config/auth.config';
import appConfig from 'src/infrastructure/config/app.config';
import { BadRequestException } from '@nestjs/common';

describe('GoogleController', () => {
	let controller: GoogleController;

	const mockGoogleAuthService = {
		generateGoogleAuthUrl: jest.fn(),
		handleGoogleCallback: jest.fn(),
	};

	const mockAuthConfig = {
		refreshTokenCookieName: 'refresh-token',
		refreshTokenCookiePath: '/auth',
		refreshTokenCookieAge: 86400000,
	};

	const mockAppConfig = {
		clientUrl: 'http://localhost:3000',
	};

	const mockResponse = {
		redirect: jest.fn(),
		cookie: jest.fn(),
	} as unknown as Response;

	const mockSession = {} as Record<string, any>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [GoogleController],
			providers: [
				{
					provide: GoogleAuthService,
					useValue: mockGoogleAuthService,
				},
				{
					provide: authConfig.KEY,
					useValue: mockAuthConfig,
				},
				{
					provide: appConfig.KEY,
					useValue: mockAppConfig,
				},
			],
		}).compile();

		controller = module.get<GoogleController>(GoogleController);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('googleAuth', () => {
		it('should redirect to Google auth URL and set session state', () => {
			const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=...';
			const mockState = 'random-state';

			mockGoogleAuthService.generateGoogleAuthUrl.mockReturnValue({
				url: mockUrl,
				state: mockState,
			});

			controller.googleAuth(mockResponse, mockSession);

			expect(mockGoogleAuthService.generateGoogleAuthUrl).toHaveBeenCalled();
			expect(mockSession.state).toBe(mockState);

			expect(mockResponse.redirect).toHaveBeenCalledWith(mockUrl);
		});
	});

	describe('googleCallback', () => {
		const agent = 'Mozilla/5.0';

		beforeEach(() => {
			(mockResponse.redirect as any).mockClear();
			(mockResponse.cookie as any).mockClear();
		});

		it('should throw BadRequestException if query has error', async () => {
			const query = { error: 'access_denied' };

			await expect(controller.googleCallback(mockResponse, query, mockSession, agent)).rejects.toThrow(
				BadRequestException,
			);
			await expect(controller.googleCallback(mockResponse, query, mockSession, agent)).rejects.toThrow(
				'Google OAuth error: access_denied',
			);
		});

		it('should throw BadRequestException if code is not provided', async () => {
			const query = { state: 'valid-state' };
			mockSession.state = 'valid-state';

			await expect(controller.googleCallback(mockResponse, query, mockSession, agent)).rejects.toThrow(
				BadRequestException,
			);
			await expect(controller.googleCallback(mockResponse, query, mockSession, agent)).rejects.toThrow(
				'Authorization code not provided',
			);
		});

		it('should throw BadRequestException if state does not match session state', async () => {
			const query = { code: 'auth-code', state: 'invalid-state' };
			mockSession.state = 'valid-state';

			await expect(controller.googleCallback(mockResponse, query, mockSession, agent)).rejects.toThrow(
				BadRequestException,
			);
			await expect(controller.googleCallback(mockResponse, query, mockSession, agent)).rejects.toThrow(
				'Invalid state parameter',
			);
		});

		it('should handle callback successfully and redirect to success page', async () => {
			const query = { code: 'auth-code', state: 'valid-state' };
			mockSession.state = 'valid-state';
			const refreshToken = 'refresh-token-value';

			mockGoogleAuthService.handleGoogleCallback.mockResolvedValue({ refreshToken });

			await controller.googleCallback(mockResponse, query, mockSession, agent);

			expect(mockGoogleAuthService.handleGoogleCallback).toHaveBeenCalledWith(agent, 'auth-code');
			expect(mockResponse.cookie).toHaveBeenCalledWith(
				mockAuthConfig.refreshTokenCookieName,
				refreshToken,
				expect.objectContaining({
					httpOnly: true,
					secure: false,
					sameSite: 'strict',
					path: mockAuthConfig.refreshTokenCookiePath,
					maxAge: mockAuthConfig.refreshTokenCookieAge,
				}),
			);
			expect(mockResponse.redirect).toHaveBeenCalledWith(`${mockAppConfig.clientUrl}/auth/success`);
		});
	});
});
