import * as Joi from 'joi';

export default Joi.object({
	NODE_ENV: Joi.string().valid('development', 'test', 'production', 'staging').default('development'),
	DB_PORT: Joi.number().port().default(5432),
	DB_USER: Joi.string().required(),
	DB_PASSWORD: Joi.string().required(),
	DB_HOST: Joi.string().required(),
	DB_NAME: Joi.string().required(),
	DB_SYNC: Joi.boolean().required(),
	DB_AUTOLOAD: Joi.boolean().required(),
	JWT_SECRET: Joi.string().required(),
	JWT_TOKEN_AUDIENCE: Joi.string().required(),
	JWT_TOKEN_ISSUER: Joi.string().required(),
	JWT_ACCESS_TOKEN_TTL: Joi.number().default(3600),
	JWT_REFRESH_TOKEN_TTL: Joi.number().default(86400),
});
