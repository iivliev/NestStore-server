import request from 'supertest';
import { App } from 'supertest/types';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { bootstrapNestApplication } from 'test/helpers/bootstrap-nest-application.helper';
import { dropDatabase } from 'test/helpers/drop-database.helper';

type TestResponse = {
	body: Record<string, any>;
	headers: Record<string, string>;
};

const GOOGLE_AUTH_ENDPOINT = '/google';
const GOOGLE_CALLBACK_ENDPOINT = '/google/callback';

describe('[Google Auth] @Get Endpoints', () => {
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

	describe(`${GOOGLE_AUTH_ENDPOINT} (GET)`, () => {
		it('should redirect to Google OAuth URL', async () => {
			const response: TestResponse = await request(httpServer).get(GOOGLE_AUTH_ENDPOINT).expect(302);

			expect(response.headers.location).toBeDefined();
			expect(response.headers.location).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/);
			expect(response.headers['set-cookie']).toBeDefined(); // session cookie
		});
	});

	/**
	 * Testing the success case requires mocking Google's API, which is complex in e2e tests.
	 * For now, covered the error cases.
	 *
	 */
	describe(`${GOOGLE_CALLBACK_ENDPOINT} (GET)`, () => {
		it('should fail with BadRequestException if query has error', async () => {
			await request(httpServer).get(GOOGLE_CALLBACK_ENDPOINT).query({ error: 'access_denied' }).expect(400);
		});

		it('should fail with BadRequestException if code is not provided', async () => {
			await request(httpServer).get(GOOGLE_CALLBACK_ENDPOINT).query({ state: 'some-state' }).expect(400);
		});

		it('should fail with BadRequestException if state does not match session state', async () => {
			// First, get the session by calling /google
			const authResponse = await request(httpServer).get(GOOGLE_AUTH_ENDPOINT).expect(302);

			const sessionCookie = authResponse.headers['set-cookie'][0];

			// Now call callback with wrong state
			await request(httpServer)
				.get(GOOGLE_CALLBACK_ENDPOINT)
				.set('Cookie', sessionCookie)
				.query({ code: 'fake-code', state: 'wrong-state' })
				.expect(400);
		});
	});
});
