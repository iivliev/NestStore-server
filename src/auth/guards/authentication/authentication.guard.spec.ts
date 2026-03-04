import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationGuard } from './authentication.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AccessTokenGuard } from '../access-token/access-token.guard';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { AUTH_TYPE_KEY } from 'src/auth/constants/auth.constants';

describe('AuthenticationGuard', () => {
	let guard: AuthenticationGuard;

	const mockAccessTokenGuard = {
		canActivate: jest.fn(),
	};

	const mockReflector = {
		getAllAndOverride: jest.fn(),
	};

	const mockExecutionContext = {
		getHandler: jest.fn(),
		getClass: jest.fn(),
		switchToHttp: jest.fn(),
	} as unknown as ExecutionContext;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthenticationGuard,
				{
					provide: Reflector,
					useValue: mockReflector,
				},
				{
					provide: AccessTokenGuard,
					useValue: mockAccessTokenGuard,
				},
			],
		}).compile();

		guard = module.get<AuthenticationGuard>(AuthenticationGuard);

		jest.clearAllMocks();
	});

	describe('canActivate', () => {
		it('should return true for public routes', async () => {
			mockReflector.getAllAndOverride.mockReturnValue([AuthType.Public]);

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(AUTH_TYPE_KEY, [
				mockExecutionContext.getHandler(),
				mockExecutionContext.getClass(),
			]);
			expect(mockAccessTokenGuard.canActivate).not.toHaveBeenCalled();
		});

		it('should return true for private routes with valid access token', async () => {
			mockReflector.getAllAndOverride.mockReturnValue([AuthType.Private]);
			mockAccessTokenGuard.canActivate.mockResolvedValue(true);

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockAccessTokenGuard.canActivate).toHaveBeenCalledWith(mockExecutionContext);
		});

		it('should throw UnauthorizedException for private routes with invalid access token', async () => {
			mockReflector.getAllAndOverride.mockReturnValue([AuthType.Private]);
			mockAccessTokenGuard.canActivate.mockResolvedValue(false);

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
			expect(mockAccessTokenGuard.canActivate).toHaveBeenCalledWith(mockExecutionContext);
		});

		it('should use default auth type (Private) when no metadata is present', async () => {
			mockReflector.getAllAndOverride.mockReturnValue(null);
			mockAccessTokenGuard.canActivate.mockResolvedValue(true);

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockAccessTokenGuard.canActivate).toHaveBeenCalledWith(mockExecutionContext);
		});

		it('should use default auth type (Private) when undefined metadata is present', async () => {
			mockReflector.getAllAndOverride.mockReturnValue(undefined);
			mockAccessTokenGuard.canActivate.mockResolvedValue(true);

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockAccessTokenGuard.canActivate).toHaveBeenCalledWith(mockExecutionContext);
		});

		it('should return true if any guard succeeds in multiple auth types', async () => {
			mockReflector.getAllAndOverride.mockReturnValue([AuthType.Private, AuthType.Public]);
			mockAccessTokenGuard.canActivate.mockResolvedValue(false);

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockAccessTokenGuard.canActivate).toHaveBeenCalledWith(mockExecutionContext);
		});

		it('should handle access token guard throwing error', async () => {
			mockReflector.getAllAndOverride.mockReturnValue([AuthType.Private]);
			mockAccessTokenGuard.canActivate.mockRejectedValue(new UnauthorizedException());

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
		});

		it('should catch guard errors and continue to next guard', async () => {
			mockReflector.getAllAndOverride.mockReturnValue([AuthType.Private, AuthType.Public]);
			mockAccessTokenGuard.canActivate.mockRejectedValue(new Error('Access denied'));

			const result = await guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockAccessTokenGuard.canActivate).toHaveBeenCalledWith(mockExecutionContext);
		});

		it('should throw UnauthorizedException when all guards fail', async () => {
			mockReflector.getAllAndOverride.mockReturnValue([AuthType.Private]);
			mockAccessTokenGuard.canActivate.mockRejectedValue(new Error('Token invalid'));

			await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
		});
	});
});
