import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
	environment: process.env.NODE_ENV,
	port: process.env.PORT,
	clientUrl: process.env.CLIENT_URL,
}));
