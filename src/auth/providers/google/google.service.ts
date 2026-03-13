import { BadGatewayException, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import authConfig from 'src/auth/config/auth.config';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { googlePayloadSchema, GoogleTokenResponse, googleTokenResponseSchema } from './schema/google.schema';
import { UsersService } from 'src/users/users.service';
import { JwtService } from 'src/auth/jwt/jwt.service';
import { AuthProviderType } from 'src/auth/enums/auth-type.enum';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class GoogleAuthService implements OnModuleInit {
	private oauthClient: OAuth2Client;

	constructor(
		@Inject(authConfig.KEY)
		private readonly authConfiguration: ConfigType<typeof authConfig>,

		private readonly usersService: UsersService,

		private readonly jwtService: JwtService,

		private readonly authService: AuthService,
	) {}

	onModuleInit() {
		const clientId = this.authConfiguration.googleClientId;
		const clientSecret = this.authConfiguration.googleClientSecret;

		this.oauthClient = new OAuth2Client(clientId, clientSecret);
	}

	generateGoogleAuthUrl() {
		const state = crypto.randomBytes(16).toString('hex');
		const params = new URLSearchParams({
			client_id: this.authConfiguration.googleClientId,
			redirect_uri: this.authConfiguration.googleRedirectUrl,
			response_type: 'code',
			scope: this.authConfiguration.googleAuthScope,
			prompt: 'consent',
			state,
		});

		return { url: `${this.authConfiguration.googleAuthUrl}?${params}`, state };
	}

	async handleGoogleCallback(agent: string, code: string) {
		const tokens = await this.exchangeCodeForTokens(code);

		const verifyResult = await this.oauthClient.verifyIdToken({
			idToken: tokens.id_token,
			audience: this.authConfiguration.googleClientId,
		});

		const payload = verifyResult.getPayload();

		const googlePayloadResult = googlePayloadSchema.safeParse(payload);

		if (!googlePayloadResult.success) {
			throw new BadGatewayException(`Failed to parse Google payload: ${googlePayloadResult.error.message}`);
		}

		const { sub: providerId, email, name, email_verified } = googlePayloadResult.data;

		const existingAuth = await this.authService.findAuthByProvider(AuthProviderType.GOOGLE, providerId);

		if (existingAuth) {
			return this.jwtService.generateAndStoreTokens(existingAuth.user.id, agent);
		}

		const newUser = await this.usersService.create({
			email,
			name,
			confirmed: email_verified,
		});

		await this.authService.createAuthProviderForUser(newUser, AuthProviderType.GOOGLE, providerId);

		return this.jwtService.generateAndStoreTokens(newUser.id, agent);
	}

	private async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
		const response = await fetch(this.authConfiguration.googleTokenUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				code,
				client_id: this.authConfiguration.googleClientId,
				client_secret: this.authConfiguration.googleClientSecret,
				redirect_uri: this.authConfiguration.googleRedirectUrl,
				grant_type: 'authorization_code',
			}),
		});

		if (!response.ok) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const error = await response.json();

			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			throw new BadGatewayException(`Failed to exchange code for tokens: ${error?.error_description || error?.error}`);
		}

		const data = (await response.json()) as object;

		const result = googleTokenResponseSchema.safeParse(data);

		if (!result.success) {
			throw new BadGatewayException(`Failed to parse Google token response: ${result.error.message}`);
		}

		return result.data;
	}
}
