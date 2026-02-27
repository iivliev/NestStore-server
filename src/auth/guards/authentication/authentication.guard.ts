import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { AccessTokenGuard } from '../access-token/access-token.guard';
import { AUTH_TYPE_KEY } from 'src/auth/constants/auth.constants';

@Injectable()
export class AuthenticationGuard implements CanActivate {
	private static readonly defaultAuthType = AuthType.Private;

	private readonly authTypeGuardMap: Record<AuthType, CanActivate | CanActivate[]>;

	constructor(
		private readonly reflector: Reflector,
		private readonly accessTokenGuard: AccessTokenGuard,
	) {
		this.authTypeGuardMap = {
			[AuthType.Private]: this.accessTokenGuard,
			[AuthType.Public]: { canActivate: () => true },
		};
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const authTypes: AuthType[] = this.reflector.getAllAndOverride(AUTH_TYPE_KEY, [
			context.getHandler(),
			context.getClass(),
		]) ?? [AuthenticationGuard.defaultAuthType];

		const guards = authTypes.map((type) => this.authTypeGuardMap[type]).flat();

		for (const instance of guards) {
			const canActivate = await Promise.resolve(instance.canActivate(context)).catch(() => false);

			if (canActivate) {
				return true;
			}
		}
		throw new UnauthorizedException();
	}
}
