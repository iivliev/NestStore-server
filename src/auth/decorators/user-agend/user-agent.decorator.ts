import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from 'src/auth/interfaces/jwt.interface';

export const UserAgent = createParamDecorator((field: keyof JwtPayload, ctx: ExecutionContext): string | null => {
	const request = ctx.switchToHttp().getRequest<Request>();

	const agent = typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : null;

	return agent;
});
