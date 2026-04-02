import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import authConfig from 'src/auth/config/auth.config';
import { JwtDecoded, JwtPayload } from '../interfaces/jwt.interface';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
	GenerateAndStoreTokensParams,
	InsertRefreshTokenParams,
	RefreshTokensParams,
	SignTokenPayload,
} from '../types/jwt.type';
import { HashingProvider } from 'src/infrastructure/security/hashing/hashing.provider';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtService {
	constructor(
		@InjectRepository(RefreshToken)
		private readonly refreshTokenRepository: Repository<RefreshToken>,

		@Inject(authConfig.KEY)
		private readonly authConfiguration: ConfigType<typeof authConfig>,

		private readonly jwtService: NestJwtService,

		private readonly hashingProvider: HashingProvider,

		private readonly usersService: UsersService,
	) {}

	async signToken<T>({ sub, role, expiresIn, secret, payload }: SignTokenPayload<T>) {
		return await this.jwtService.signAsync(
			{
				sub,
				role,
				...payload,
			},
			{
				audience: this.authConfiguration.jwtAudience,
				issuer: this.authConfiguration.jwtIssuer,
				secret,
				expiresIn,
			},
		);
	}

	async generateTokens({ sub, role }: JwtPayload) {
		const [accessToken, refreshToken] = await Promise.all([
			this.signToken({
				sub,
				role,
				expiresIn: this.authConfiguration.jwtAccessTokenTtl,
				secret: this.authConfiguration.jwtAccessTokenSecret,
			}),
			this.signToken({
				sub,
				secret: this.authConfiguration.jwtRefreshTokenSecret,
				expiresIn: this.authConfiguration.jwtRefreshTokenTtl,
			}),
		]);

		return {
			accessToken,
			refreshToken,
		};
	}

	async findActiveRefreshTokens(userId: number): Promise<RefreshToken[]> {
		return await this.refreshTokenRepository.find({
			where: { user: { id: userId }, revokedAt: IsNull() },
			order: { createdAt: 'ASC' },
		});
	}

	/**
	 * insertRefreshToken is responsible for inserting a new refresh token into the database.
	 * It decodes the token to get the expiration time, checks if the user has exceeded the maximum number of active tokens,
	 * and if so, revokes the oldest one before inserting the new token. The token is hashed before being stored for security reasons.
	 *
	 */
	async insertRefreshToken({ userId, refreshToken, agent }: InsertRefreshTokenParams) {
		const decodedToken = this.jwtService.decode<JwtDecoded>(refreshToken);

		if (!decodedToken || !decodedToken.exp) {
			throw new BadRequestException('Could not decode refresh token or missing exp claim');
		}

		const expiresAt = new Date(decodedToken.exp * 1000);

		const activeTokens = await this.findActiveRefreshTokens(userId);

		if (activeTokens.length >= this.authConfiguration.jwtMaxActiveTokens) {
			activeTokens[0].revokedAt = new Date();
			await this.refreshTokenRepository.save(activeTokens[0]);
		}

		const hashedToken = await this.hashingProvider.hash(refreshToken);

		await this.refreshTokenRepository.insert({
			user: { id: userId },
			agent,
			hashedToken,
			expiresAt,
		});
	}

	/**
	 * getMatchedRefreshToken is responsible for finding a refresh token in the database that matches the provided plain refresh token.
	 * Since we store only the hashed version of the token, we need to fetch all active tokens for the user and compare their hashes
	 * with the provided token. If a match is found, it returns the corresponding RefreshToken entity; otherwise, it throws an UnauthorizedException.
	 *
	 */
	async getMatchedRefreshToken(userId: number, refreshToken: string): Promise<RefreshToken> {
		const tokens = await this.findActiveRefreshTokens(userId);

		let matchingToken: RefreshToken | undefined = undefined;

		for (const token of tokens) {
			const isMatch = await this.hashingProvider.compare(refreshToken, token.hashedToken);
			if (isMatch) {
				matchingToken = token;
				break;
			}
		}

		if (!matchingToken) {
			throw new UnauthorizedException('Refresh token not found or already revoked');
		}

		return matchingToken;
	}

	async refreshTokens({ userId, refreshToken, agent }: RefreshTokensParams) {
		await this.revokeRefreshToken(userId, refreshToken);

		const user = await this.usersService.findOneById(userId);

		if (!user) {
			throw new BadRequestException(`User with ID ${userId} not found`);
		}

		const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens({
			sub: userId,
			role: user.role,
		});

		await this.insertRefreshToken({
			userId,
			refreshToken: newRefreshToken,
			agent,
		});

		return {
			accessToken,
			refreshToken: newRefreshToken,
		};
	}

	async revokeRefreshToken(userId: number, refreshToken: string): Promise<void> {
		const matchedToken = await this.getMatchedRefreshToken(userId, refreshToken);

		const result = await this.refreshTokenRepository.update(
			{
				user: { id: userId },
				hashedToken: matchedToken.hashedToken,
				revokedAt: IsNull(),
			},
			{ revokedAt: new Date() },
		);

		if (result.affected === 0) {
			throw new BadRequestException('Refresh token not found or already revoked');
		}
	}

	async generateAndStoreTokens({ userId, agent, role }: GenerateAndStoreTokensParams) {
		const { accessToken, refreshToken } = await this.generateTokens({ sub: userId, role });
		await this.insertRefreshToken({ userId, refreshToken, agent });
		return { accessToken, refreshToken };
	}
}
