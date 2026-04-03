import { Test, TestingModule } from '@nestjs/testing';
import { ProductAdminController } from './product-admin.controller';
import { ProductService } from '../../product.service';

describe('ProductAdminController', () => {
	let controller: ProductAdminController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ProductAdminController],
			providers: [ProductService],
		}).compile();

		controller = module.get<ProductAdminController>(ProductAdminController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
