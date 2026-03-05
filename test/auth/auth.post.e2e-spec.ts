import request from 'supertest';

import { App } from 'supertest/types';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { bootstrapNestApplication } from 'test/helpers/bootstrap-nest-application.helper';
import { dropDatabase } from 'test/helpers/drop-database.helper';
import { faker } from '@faker-js/faker';

type TestResponse = {
	body: Record<string, any>;
	headers: Record<string, string>;
};

const SIGN_UP_ENDPOINT = '/auth/sign-up';
const SIGN_IN_ENDPOINT = '/auth/sign-in';
const SIGN_OUT_ENDPOINT = '/auth/sign-out';
const REFRESH_TOKENS_ENDPOINT = '/auth/refresh-tokens';

describe('[Auth] @Post Endpoints', () => {
	let app: INestApplication;
	let config: ConfigService;
	let httpServer: App;

	beforeEach(async () => {
		app = await bootstrapNestApplication();

		config = app.get(ConfigService);
		httpServer = app.getHttpServer() as App;
	});

	afterEach(async () => {
		await dropDatabase(config);
		await app.close();
	});

	describe('/auth/sign-up (POST)', () => {
		it('should successfully sign up a new user with valid data', async () => {
			const signUpDto = {
				email: faker.internet.email(),
				name: faker.person.fullName(),
				password: 'Password123',
			};

			const response: TestResponse = await request(httpServer).post(SIGN_UP_ENDPOINT).send(signUpDto).expect(201);

			expect(response.body).toHaveProperty('accessToken');
			expect(response.body.accessToken).toBeDefined();
			expect(response.headers['set-cookie']).toBeDefined();
		});

		it('should fail with invalid email', async () => {
			const signUpDto = {
				email: 'invalid-email',
				name: faker.person.fullName(),
				password: 'Password123',
			};

			await request(httpServer).post(SIGN_UP_ENDPOINT).send(signUpDto).expect(400);
		});

		it('should fail with password too short', async () => {
			const signUpDto = {
				email: faker.internet.email(),
				name: faker.person.fullName(),
				password: 'Pass1',
			};

			await request(httpServer).post(SIGN_UP_ENDPOINT).send(signUpDto).expect(400);
		});

		it('should fail with password missing number', async () => {
			const signUpDto = {
				email: faker.internet.email(),
				name: faker.person.fullName(),
				password: 'Password',
			};

			await request(httpServer).post(SIGN_UP_ENDPOINT).send(signUpDto).expect(400);
		});

		it('should fail with password missing letter', async () => {
			const signUpDto = {
				email: faker.internet.email(),
				name: faker.person.fullName(),
				password: '123456',
			};

			await request(httpServer).post(SIGN_UP_ENDPOINT).send(signUpDto).expect(400);
		});

		it('should fail with missing email', async () => {
			const signUpDto = {
				name: faker.person.fullName(),
				password: 'Password123',
			};

			await request(httpServer).post(SIGN_UP_ENDPOINT).send(signUpDto).expect(400);
		});

		it('should fail with missing name', async () => {
			const signUpDto = {
				email: faker.internet.email(),
				password: 'Password123',
			};

			await request(httpServer).post(SIGN_UP_ENDPOINT).send(signUpDto).expect(400);
		});

		it('should fail with missing password', async () => {
			const signUpDto = {
				email: faker.internet.email(),
				name: faker.person.fullName(),
			};

			await request(httpServer).post(SIGN_UP_ENDPOINT).send(signUpDto).expect(400);
		});

		it('should fail with duplicate email', async () => {
			const signUpDto = {
				email: faker.internet.email(),
				name: faker.person.fullName(),
				password: 'Password123',
			};

			await request(httpServer).post(SIGN_UP_ENDPOINT).send(signUpDto).expect(201);

			await request(httpServer).post(SIGN_UP_ENDPOINT).send(signUpDto).expect(400);
		});

		it('should fail with name too short', async () => {
			const signUpDto = {
				email: faker.internet.email(),
				name: 'ab',
				password: 'Password123',
			};

			await request(httpServer).post(SIGN_UP_ENDPOINT).send(signUpDto).expect(400);
		});
	});

	describe('/auth/sign-in (POST)', () => {
		it('should successfully sign in with valid credentials', async () => {
			const userCredentials = {
				email: faker.internet.email(),
				name: faker.person.fullName(),
				password: 'Password123',
			};

			await request(httpServer).post(SIGN_UP_ENDPOINT).send(userCredentials).expect(201);

			const signInDto = {
				email: userCredentials.email,
				password: userCredentials.password,
			};

			const response: TestResponse = await request(httpServer).post(SIGN_IN_ENDPOINT).send(signInDto).expect(201);

			expect(response.body).toHaveProperty('accessToken');
			expect(response.body.accessToken).toBeDefined();
			expect(response.headers['set-cookie']).toBeDefined();
		});

		it('should fail with invalid email format', async () => {
			const signInDto = {
				email: 'invalid-email',
				password: 'Password123',
			};

			await request(httpServer).post(SIGN_IN_ENDPOINT).send(signInDto).expect(400);
		});

		it('should fail with non-existent user', async () => {
			const signInDto = {
				email: faker.internet.email(),
				password: 'Password123',
			};

			await request(httpServer).post(SIGN_IN_ENDPOINT).send(signInDto).expect(400);
		});

		it('should fail with wrong password', async () => {
			const userCredentials = {
				email: faker.internet.email(),
				name: faker.person.fullName(),
				password: 'Password123',
			};

			await request(httpServer).post(SIGN_UP_ENDPOINT).send(userCredentials).expect(201);

			const signInDto = {
				email: userCredentials.email,
				password: 'WrongPass123',
			};

			await request(httpServer).post(SIGN_IN_ENDPOINT).send(signInDto).expect(400);
		});

		it('should fail with missing email', async () => {
			const signInDto = {
				password: 'Password123',
			};

			await request(httpServer).post(SIGN_IN_ENDPOINT).send(signInDto).expect(400);
		});

		it('should fail with missing password', async () => {
			const signInDto = {
				email: faker.internet.email(),
			};

			await request(httpServer).post(SIGN_IN_ENDPOINT).send(signInDto).expect(400);
		});

		it('should fail with password too short', async () => {
			const signInDto = {
				email: faker.internet.email(),
				password: 'Pass1',
			};

			await request(httpServer).post(SIGN_IN_ENDPOINT).send(signInDto).expect(400);
		});

		it('should fail with password missing number', async () => {
			const signInDto = {
				email: faker.internet.email(),
				password: 'Password',
			};

			await request(httpServer).post(SIGN_IN_ENDPOINT).send(signInDto).expect(400);
		});

		it('should fail with password missing letter', async () => {
			const signInDto = {
				email: faker.internet.email(),
				password: '123456',
			};

			await request(httpServer).post(SIGN_IN_ENDPOINT).send(signInDto).expect(400);
		});
	});

	describe('/auth/sign-out (POST)', () => {
		it('should successfully sign out with valid refresh token', async () => {
			const userCredentials = {
				email: faker.internet.email(),
				name: faker.person.fullName(),
				password: 'Password123',
			};

			const signUpResponse: TestResponse = await request(httpServer)
				.post(SIGN_UP_ENDPOINT)
				.send(userCredentials)
				.expect(201);

			const cookies = signUpResponse.headers['set-cookie'];

			await request(httpServer).post(SIGN_OUT_ENDPOINT).set('Cookie', cookies).expect(201);
		});

		it('should fail to sign out without refresh token', async () => {
			await request(httpServer).post(SIGN_OUT_ENDPOINT).expect(401);
		});

		it('should fail to sign out with invalid refresh token', async () => {
			const invalidCookie = 'refreshToken=invalid.token.here';

			await request(httpServer).post(SIGN_OUT_ENDPOINT).set('Cookie', invalidCookie).expect(401);
		});
	});

	describe('/auth/refresh-tokens (POST)', () => {
		it('should successfully refresh tokens with valid refresh token', async () => {
			const userCredentials = {
				email: faker.internet.email(),
				name: faker.person.fullName(),
				password: 'Password123',
			};

			const signUpResponse: TestResponse = await request(httpServer)
				.post(SIGN_UP_ENDPOINT)
				.send(userCredentials)
				.expect(201);

			const cookies = signUpResponse.headers['set-cookie'];

			const refreshResponse: TestResponse = await request(httpServer)
				.post(REFRESH_TOKENS_ENDPOINT)
				.set('Cookie', cookies)
				.expect(201);

			expect(refreshResponse.body).toHaveProperty('accessToken');
			expect(refreshResponse.body.accessToken).toBeDefined();
			expect(refreshResponse.headers['set-cookie']).toBeDefined();
		});

		it('should fail to refresh tokens without refresh token', async () => {
			await request(httpServer).post(REFRESH_TOKENS_ENDPOINT).expect(401);
		});

		it('should fail to refresh tokens with invalid refresh token', async () => {
			const invalidCookie = 'refreshToken=invalid.token.here';

			await request(httpServer).post(REFRESH_TOKENS_ENDPOINT).set('Cookie', invalidCookie).expect(401);
		});

		it('should fail to refresh tokens with revoked refresh token', async () => {
			const userCredentials = {
				email: faker.internet.email(),
				name: faker.person.fullName(),
				password: 'Password123',
			};

			const signUpResponse: TestResponse = await request(httpServer)
				.post(SIGN_UP_ENDPOINT)
				.send(userCredentials)
				.expect(201);

			const cookies = signUpResponse.headers['set-cookie'];

			await request(httpServer).post(SIGN_OUT_ENDPOINT).set('Cookie', cookies).expect(201);

			await request(httpServer).post(REFRESH_TOKENS_ENDPOINT).set('Cookie', cookies).expect(401);
		});
	});
});
