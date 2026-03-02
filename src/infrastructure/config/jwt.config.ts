import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
	accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
	refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
	audience: process.env.JWT_TOKEN_AUDIENCE,
	issuer: process.env.JWT_TOKEN_ISSUER,
	accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL!, 10),
	refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL!, 10),
	maxActiveTokens: parseInt(process.env.MAX_ACTIVE_TOKENS!, 10),
	refreshTokenCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME!,
}));
