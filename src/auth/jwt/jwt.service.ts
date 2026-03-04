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

@Injectable()
export class JwtService {
	constructor(
		@InjectRepository(RefreshToken)
		private readonly refreshTokenRepository: Repository<RefreshToken>,

		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,

		private readonly jwtService: NestJwtService,
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

	async insertRefreshToken({ userId, refreshToken, agent }: InsertRefreshTokenParams) {
		const decodedToken = this.jwtService.decode<JwtDecoded>(refreshToken);

		const expiresAt = new Date(decodedToken.exp * 1000);

		const activeTokens = await this.refreshTokenRepository.find({
			where: { user: { id: userId }, revokedAt: IsNull() },
			order: { createdAt: 'ASC' },
		});

		if (activeTokens.length >= this.jwtConfiguration.maxActiveTokens) {
			await this.refreshTokenRepository.delete(activeTokens[0].id);
		}

		await this.refreshTokenRepository.insert({
			user: { id: userId },
			agent,
			refreshToken,
			expiresAt,
		});
	}

	async refreshTokens(userId: number, refreshToken: string, agent: string) {
		const result = await this.refreshTokenRepository.update(
			{
				user: { id: userId },
				refreshToken,
				revokedAt: IsNull(),
			},
			{ revokedAt: new Date() },
		);

		if (result.affected === 0) {
			throw new UnauthorizedException('Refresh token not found or already revoked');
		}

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

	async revokeRefreshToken(refreshToken: string): Promise<void> {
		const result = await this.refreshTokenRepository.update(
			{ refreshToken, revokedAt: IsNull() },
			{ revokedAt: new Date() },
		);

		if (result.affected === 0) {
			throw new BadRequestException('Refresh token not found or already revoked');
		}
	}
}
