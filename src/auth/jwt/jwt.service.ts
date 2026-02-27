import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import jwtConfig from 'src/infrastructure/config/jwt.config';
import { User } from 'src/users/entities/user.entity';
import { JwtDecoded, JwtPayload } from '../interfaces/jwt.interface';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingProvider } from 'src/infrastructure/security/hashing/hashing.provider';
import { InsertRefreshTokenParams } from '../types/jwt.type';

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

	async signToken<T>(userId: number, expiresIn: number, payload?: T) {
		return await this.jwtService.signAsync(
			{
				sub: userId,
				...payload,
			},
			{
				audience: this.jwtConfiguration.audience,
				issuer: this.jwtConfiguration.issuer,
				secret: this.jwtConfiguration.secret,
				expiresIn,
			},
		);
	}

	async generateTokens({ id: userId, email }: Pick<User, 'id' | 'email'>) {
		const [accessToken, refreshToken] = await Promise.all([
			this.signToken<Partial<JwtPayload>>(userId, this.jwtConfiguration.accessTokenTtl, {
				email,
			}),
			this.signToken(userId, this.jwtConfiguration.refreshTokenTtl),
		]);

		return {
			accessToken,
			refreshToken,
		};
	}

	async decodeToken(token: string): Promise<JwtDecoded> {
		return await this.jwtService.decode(token);
	}

	async insertRefreshToken({ user, refreshToken, agent }: InsertRefreshTokenParams) {
		const hashedRefreshToken = await this.hashingProvider.hash(refreshToken);

		const decodedToken = await this.decodeToken(refreshToken);

		const expiresAt = new Date(decodedToken.exp * 1000);

		const existingTokens = await this.refreshTokenRepository.find({
			where: { user: { id: user.id } },
			order: { createdAt: 'ASC' },
		});

		if (existingTokens.length >= 5) {
			await this.refreshTokenRepository.delete(existingTokens[0].id);
		}

		await this.refreshTokenRepository.insert({
			user,
			agent,
			hashedRefreshToken,
			expiresAt,
		});
	}

	async findRefreshToken(refreshToken: string): Promise<RefreshToken | null> {
		const hashedRefreshToken = await this.hashingProvider.hash(refreshToken);
		return await this.refreshTokenRepository.findOne({
			where: { hashedRefreshToken },
		});
	}

	async revokeRefreshToken(token: string): Promise<void> {
		const hashedRefreshToken = await this.hashingProvider.hash(token);
		const result = await this.refreshTokenRepository.update(
			{ hashedRefreshToken, revokedAt: IsNull() },
			{ revokedAt: new Date() },
		);

		if (result.affected === 0) {
			throw new UnauthorizedException();
		}
	}
}
