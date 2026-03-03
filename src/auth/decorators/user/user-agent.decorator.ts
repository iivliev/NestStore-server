import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserAgent = createParamDecorator((data: unknown, ctx: ExecutionContext): string | null => {
	const request = ctx.switchToHttp().getRequest<Request>();

	const agent = typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : null;

	return agent;
});
