import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefreshToken } from '../entities/refresh-token.entity';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RefreshTokenCleanupService {
	constructor(
		@InjectRepository(RefreshToken)
		private readonly refreshTokenRepository: Repository<RefreshToken>,
	) {}

	@Cron(CronExpression.EVERY_WEEK)
	async handleCleanup() {
		await this.refreshTokenRepository.delete({
			revokedAt: Not(IsNull()),
			expiresAt: LessThan(new Date()),
		});
	}
}
