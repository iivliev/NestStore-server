import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { GetProductsDto } from 'src/product/dto/get-products.dto';
import { ProductService } from 'src/product/product.service';

@ApiTags('Products')
@Auth(AuthType.Public)
@Controller('product')
export class ProductPublicController {
	constructor(private readonly productService: ProductService) {}

	@Get()
	@ApiOperation({ summary: 'Get a list of products with optional filters' })
	@ApiResponse({ status: 200, description: 'List of products retrieved successfully.' })
	@ApiResponse({ status: 400, description: 'Bad request.' })
	@ApiResponse({ status: 404, description: 'Not found.' })
	async getProducts(@Query() filters: GetProductsDto) {
		return await this.productService.findAll(filters);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a product by its ID' })
	@ApiResponse({ status: 200, description: 'Product retrieved successfully.' })
	@ApiResponse({ status: 400, description: 'Bad request.' })
	@ApiResponse({ status: 404, description: 'Not found.' })
	async getProductById(@Param('id') id: number) {
		return await this.productService.getProductById(id);
	}
}
