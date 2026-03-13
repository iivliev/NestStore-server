import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
	environment: process.env.NODE_ENV,
	port: process.env.PORT,
	clientUrl: process.env.CLIENT_URL,
	sessionSecret: process.env.SESSION_SECRET,
	sessionCookieMaxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE!, 10),
}));
