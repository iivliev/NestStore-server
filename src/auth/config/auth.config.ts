import { registerAs } from '@nestjs/config';

/**
 * Auth configuration registered via NestJS ConfigModule.
 *
 * Non-null assertions (!) are used because all required environment variables
 * are validated during application bootstrap by the environment validation schema
 * (environment.validation.ts). If any required variable is missing, the application
 * will fail to start, making these assertions safe.
 */
export default registerAs('auth', () => ({
	// JWT configuration
	jwtAccessTokenSecret: process.env.JWT_ACCESS_SECRET!,
	jwtRefreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
	jwtAudience: process.env.JWT_TOKEN_AUDIENCE,
	jwtIssuer: process.env.JWT_TOKEN_ISSUER,
	jwtAccessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL!, 10),
	jwtRefreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL!, 10),
	jwtMaxActiveTokens: parseInt(process.env.MAX_ACTIVE_TOKENS!, 10),
	refreshTokenCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME!,
	refreshTokenCookiePath: process.env.REFRESH_TOKEN_COOKIE_PATH!,
	refreshTokenCookieAge: parseInt(process.env.REFRESH_TOKEN_COOKIE_AGE!, 10),
	// Google OAuth configuration
	googleClientId: process.env.GOOGLE_CLIENT_ID!,
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
	googleRedirectUri: process.env.GOOGLE_REDIRECT_URI!,
}));
