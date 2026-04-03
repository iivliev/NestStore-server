import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './role.guard';
import { Reflector } from '@nestjs/core';
import { UsersService } from 'src/users/users.service';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from 'src/users/enums/user-role.enum';
import { REQUEST_USER_KEY } from 'src/auth/constants/auth.constants';

describe('RolesGuard', () => {
	let guard: RolesGuard;
	let reflector: Reflector;
	let usersService: UsersService;
	let context: ExecutionContext;

	const mockReflector = {
		getAllAndOverride: jest.fn(),
	};

	const mockUsersService = {
		findOneById: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RolesGuard,
				{ provide: Reflector, useValue: mockReflector },
				{ provide: UsersService, useValue: mockUsersService },
			],
		}).compile();

		guard = module.get<RolesGuard>(RolesGuard);
		reflector = module.get<Reflector>(Reflector);
		usersService = module.get<UsersService>(UsersService);

		context = {
			switchToHttp: jest.fn(),
			getHandler: jest.fn(),
			getClass: jest.fn(),
		} as unknown as ExecutionContext;

		jest.clearAllMocks();
	});

	it('should allow if no required roles', async () => {
		(reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
		expect(await guard.canActivate(context)).toBe(true);
	});

	it('should throw UnauthorizedException if user not authenticated', async () => {
		(reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
		(context.switchToHttp as jest.Mock).mockReturnValue({ getRequest: () => ({ [REQUEST_USER_KEY]: undefined }) });
		await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
	});

	it('should throw UnauthorizedException if user not found in DB', async () => {
		(reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
		(context.switchToHttp as jest.Mock).mockReturnValue({ getRequest: () => ({ [REQUEST_USER_KEY]: { sub: 1 } }) });
		(usersService.findOneById as jest.Mock).mockResolvedValue(undefined);
		await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
	});

	it('should throw ForbiddenException if user does not have required role', async () => {
		(reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
		(context.switchToHttp as jest.Mock).mockReturnValue({ getRequest: () => ({ [REQUEST_USER_KEY]: { sub: 1 } }) });
		(usersService.findOneById as jest.Mock).mockResolvedValue({ role: UserRole.USER });
		await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
	});

	it('should allow if user has required role', async () => {
		(reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
		(context.switchToHttp as jest.Mock).mockReturnValue({ getRequest: () => ({ [REQUEST_USER_KEY]: { sub: 1 } }) });
		(usersService.findOneById as jest.Mock).mockResolvedValue({ role: UserRole.ADMIN });
		expect(await guard.canActivate(context)).toBe(true);
	});
});
