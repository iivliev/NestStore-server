import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import jwtConfig from 'src/infrastructure/config/jwt.config';
import { User } from 'src/users/entities/user.entity';
import { JwtDecoded, JwtPayload } from '../interfaces/jwt.interface';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertRefreshTokenParams, SignTokenPayload } from '../types/jwt.type';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtService {
	constructor(
		@InjectRepository(RefreshToken)
		private readonly refreshTokenRepository: Repository<RefreshToken>,

		@Inject(jwtConfig.KEY)
		private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,

		private readonly jwtService: NestJwtService,

		private readonly usersService: UsersService,
	) {}

	async signToken<T>({ userId, expiresIn, secret, payload }: SignTokenPayload<T>) {
		return await this.jwtService.signAsync(
			{
				sub: userId,
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

	async generateTokens({ id: userId, email }: Pick<User, 'id' | 'email'>) {
		const [accessToken, refreshToken] = await Promise.all([
			this.signToken<Partial<JwtPayload>>({
				userId,
				expiresIn: this.jwtConfiguration.accessTokenTtl,
				secret: this.jwtConfiguration.accessTokenSecret,
				payload: {
					email,
				},
			}),
			this.signToken<Partial<JwtPayload>>({
				userId,
				secret: this.jwtConfiguration.refreshTokenSecret,
				expiresIn: this.jwtConfiguration.refreshTokenTtl,
			}),
		]);

		return {
			accessToken,
			refreshToken,
		};
	}

	async insertRefreshToken({ user, refreshToken, agent }: InsertRefreshTokenParams) {
		const decodedToken = this.jwtService.decode<JwtDecoded>(refreshToken);

		const expiresAt = new Date(decodedToken.exp * 1000);

		const activeTokens = await this.refreshTokenRepository.find({
			where: { user: { id: user.id }, revokedAt: IsNull() },
			order: { createdAt: 'ASC' },
		});

		if (activeTokens.length >= this.jwtConfiguration.maxActiveTokens) {
			await this.refreshTokenRepository.delete(activeTokens[0].id);
		}

		await this.refreshTokenRepository.insert({
			user,
			agent,
			refreshToken,
			expiresAt,
		});
	}

	async refreshTokens(userId: number) {
		const user = await this.usersService.findOneById(userId);

		if (!user) {
			throw new BadRequestException('User not found');
		}

		return await this.generateTokens({
			id: user.id,
			email: user.email,
		});
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
