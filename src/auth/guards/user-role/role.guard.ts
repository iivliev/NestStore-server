import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/users/enums/user-role.enum';
import { REQUEST_USER_KEY, ROLES_KEY } from 'src/auth/constants/auth.constants';
import { JwtPayload } from 'src/auth/interfaces/jwt.interface';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private usersService: UsersService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles) {
			return true;
		}

		const request = context.switchToHttp().getRequest<Request>();

		const user = request[REQUEST_USER_KEY] as Partial<JwtPayload>;

		if (!user?.sub) {
			throw new UnauthorizedException('User not authenticated');
		}

		/**
		 * I get current user from the database to be sure that I have the latest user role,
		 * because it can be changed after the token was issued.
		 *
		 */
		const dbUser = await this.usersService.findOneById(user.sub);

		if (!dbUser) {
			throw new UnauthorizedException('User not found');
		}

		const hasRole = requiredRoles.includes(dbUser.role);

		if (!hasRole) {
			throw new ForbiddenException('Insufficient permissions');
		}

		return true;
	}
}
