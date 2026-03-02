import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { REFRESH_TOKEN_KEY } from 'src/auth/constants/auth.constants';

export const RefreshToken = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
	const request = ctx.switchToHttp().getRequest<Request>();

	const token = request[REFRESH_TOKEN_KEY] as string;

	if (!token) {
		throw new UnauthorizedException('Refresh token not found in request');
	}

	return token;
});
