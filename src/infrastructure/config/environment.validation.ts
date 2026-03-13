import * as Joi from 'joi';

/**
 * ValidationSchema that defines the expected structure and constraints for environment variables used in the application.
 *
 */
export default Joi.object({
	NODE_ENV: Joi.string().valid('development', 'test', 'production', 'staging').default('development'),
	CLIENT_URL: Joi.string().uri().required(),
	PORT: Joi.number().port().default(3000),
	SESSION_SECRET: Joi.string().required(),
	SESSION_COOKIE_MAX_AGE: Joi.number().default(600000),
	DB_PORT: Joi.number().port().default(5432),
	DB_USER: Joi.string().required(),
	DB_PASSWORD: Joi.string().required(),
	DB_HOST: Joi.string().required(),
	DB_NAME: Joi.string().required(),
	DB_SYNC: Joi.boolean().required(),
	DB_AUTOLOAD: Joi.boolean().required(),
	JWT_ACCESS_SECRET: Joi.string().required(),
	JWT_REFRESH_SECRET: Joi.string().required(),
	JWT_TOKEN_AUDIENCE: Joi.string().required(),
	JWT_TOKEN_ISSUER: Joi.string().required(),
	JWT_ACCESS_TOKEN_TTL: Joi.number().default(3600),
	JWT_REFRESH_TOKEN_TTL: Joi.number().default(86400),
	MAX_ACTIVE_TOKENS: Joi.number().default(5),
	REFRESH_TOKEN_COOKIE_NAME: Joi.string().default('refreshToken'),
	REFRESH_TOKEN_COOKIE_PATH: Joi.string().default('/auth'),
	REFRESH_TOKEN_COOKIE_AGE: Joi.number().default(7 * 24 * 60 * 60 * 1000),
	GOOGLE_CLIENT_ID: Joi.string().required(),
	GOOGLE_CLIENT_SECRET: Joi.string().required(),
	GOOGLE_REDIRECT_URL: Joi.string().uri().required(),
	GOOGLE_AUTH_URL: Joi.string().uri().default('https://accounts.google.com/o/oauth2/v2/auth'),
	GOOGLE_TOKEN_URL: Joi.string().uri().default('https://oauth2.googleapis.com/token'),
	GOOGLE_AUTH_SCOPE: Joi.string().required(),
});
