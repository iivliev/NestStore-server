import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from 'src/auth/constants/auth.constants';
import { JwtPayload } from 'src/auth/interfaces/jwt.interface';

export const ActiveUser = createParamDecorator((field: keyof JwtPayload, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<Request>();

	const user = request[REQUEST_USER_KEY] as JwtPayload;

	return field ? user?.[field] : user;
});
