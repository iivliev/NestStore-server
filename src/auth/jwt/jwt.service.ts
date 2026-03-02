import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import jwtConfig from 'src/infrastructure/config/jwt.config';
import { User } from 'src/users/entities/user.entity';
import { JwtDecoded, JwtPayload } from '../interfaces/jwt.interface';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingProvider } from 'src/infrastructure/security/hashing/hashing.provider';
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

		private readonly hashingProvider: HashingProvider,

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

	async decodeToken(token: string): Promise<JwtDecoded> {
		return await this.jwtService.decode(token);
	}

	async validateToken(token: string, secret: string): Promise<JwtPayload> {
		try {
			const { sub } = await this.jwtService.verifyAsync<Pick<JwtPayload, 'sub'>>(token, {
				secret,
				audience: this.jwtConfiguration.audience,
				issuer: this.jwtConfiguration.issuer,
			});

			return { sub };
		} catch {
			throw new BadRequestException('Could not validate token');
		}
	}

	async insertRefreshToken({ user, refreshToken, agent }: InsertRefreshTokenParams) {
		const decodedToken = await this.decodeToken(refreshToken);

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

	async findRefreshToken(refreshToken: string): Promise<RefreshToken | null> {
		return await this.refreshTokenRepository.findOne({
			where: { refreshToken },
		});
	}

	async refreshTokens(refreshToken: string) {
		const secret = this.jwtConfiguration.refreshTokenSecret;
		const { sub } = await this.validateToken(refreshToken, secret);

		const user = await this.usersService.findOneById(sub);

		if (!user) {
			throw new UnauthorizedException();
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
			throw new UnauthorizedException();
		}
	}
}
