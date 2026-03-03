import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenCleanupService } from './refresh-token-cleanup-schedule.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { IsNull, LessThan, Not } from 'typeorm';

describe('RefreshTokenCleanupService', () => {
	let service: RefreshTokenCleanupService;

	const mockRefreshTokenRepository = {
		delete: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RefreshTokenCleanupService,
				{
					provide: getRepositoryToken(RefreshToken),
					useValue: mockRefreshTokenRepository,
				},
			],
		}).compile();

		service = module.get<RefreshTokenCleanupService>(RefreshTokenCleanupService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('handleCleanup', () => {
		it('should delete revoked and expired refresh tokens', async () => {
			mockRefreshTokenRepository.delete.mockResolvedValue({ affected: 5 });

			await service.handleCleanup();

			expect(mockRefreshTokenRepository.delete).toHaveBeenCalledWith({
				revokedAt: Not(IsNull()),
				expiresAt: LessThan(expect.any(Date)),
			});
		});

		it('should call delete exactly once during cleanup', async () => {
			mockRefreshTokenRepository.delete.mockResolvedValue({ affected: 3 });

			await service.handleCleanup();

			expect(mockRefreshTokenRepository.delete).toHaveBeenCalledTimes(1);
		});

		it('should handle cleanup when no tokens are deleted', async () => {
			mockRefreshTokenRepository.delete.mockResolvedValue({ affected: 0 });

			await expect(service.handleCleanup()).resolves.not.toThrow();

			expect(mockRefreshTokenRepository.delete).toHaveBeenCalledTimes(1);
		});
	});
});
