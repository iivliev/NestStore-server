import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT!, 10) || 5432,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	name: process.env.DB_NAME,
	synchronize: process.env.DB_SYNC === 'true' ? true : false,
	autoLoadEntities: process.env.DB_AUTOLOAD === 'true' ? true : false,
}));
