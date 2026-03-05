import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import jwtConfig from 'src/infrastructure/config/jwt.config';
import { User } from 'src/users/entities/user.entity';
import { JwtDecoded } from '../interfaces/jwt.interface';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertRefreshTokenParams, SignTokenPayload } from '../types/jwt.type';
import { HashingProvider } from 'src/infrastructure/security/hashing/hashing.provider';

@Injectable()
export class JwtService {
	constructor(
		@InjectRepository(RefreshToken)
		private readonly refreshTokenRepository: Repository<RefreshToken>,

		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,

		private readonly jwtService: NestJwtService,

		private readonly hashingProvider: HashingProvider,
	) {}

	async signToken<T>({ sub, expiresIn, secret, payload }: SignTokenPayload<T>) {
		return await this.jwtService.signAsync(
			{
				sub,
				...payload,
			},
			{
				audience: this.jwtConfiguration.audience,
				issuer: this.jwtConfiguration.issuer,
				secret,
				expiresIn,
			},
		);
	}

	async generateTokens({ id: userId }: Pick<User, 'id'>) {
		const [accessToken, refreshToken] = await Promise.all([
			this.signToken({
				sub: userId,
				expiresIn: this.jwtConfiguration.accessTokenTtl,
				secret: this.jwtConfiguration.accessTokenSecret,
			}),
			this.signToken({
				sub: userId,
				secret: this.jwtConfiguration.refreshTokenSecret,
				expiresIn: this.jwtConfiguration.refreshTokenTtl,
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

	async insertRefreshToken({ userId, refreshToken, agent }: InsertRefreshTokenParams) {
		const decodedToken = this.jwtService.decode<JwtDecoded>(refreshToken);

		if (!decodedToken || !decodedToken.exp) {
			throw new BadRequestException('Could not decode refresh token or missing exp claim');
		}

		const expiresAt = new Date(decodedToken.exp * 1000);

		const activeTokens = await this.findActiveRefreshTokens(userId);

		if (activeTokens.length >= this.jwtConfiguration.maxActiveTokens) {
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

	async getMatchedRefreshToken(userId: number, refreshToken: string): Promise<RefreshToken> {
		// We have to fetch all active tokens and compare the hash because we don't store the plain token.
		// User has limited number of active tokens, so this is not a performance concern and allows us to keep tokens secure in case of DB leak.
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

	async refreshTokens(userId: number, refreshToken: string, agent: string) {
		await this.revokeRefreshToken(userId, refreshToken);

		const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens({
			id: userId,
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
}
