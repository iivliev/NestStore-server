import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ProductService } from '../../product.service';
import { CreateProductDto } from '../../dto/create-product.dto';
import { UpdateProductDto } from '../../dto/update-product.dto';
import { UserRole } from 'src/users/enums/user-role.enum';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/user-role/role.guard';

@ApiTags('Product')
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Controller('product')
export class ProductAdminController {
	constructor(private readonly productService: ProductService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new product' })
	@ApiResponse({ status: 201, description: 'The product has been successfully created.' })
	@ApiResponse({ status: 400, description: 'Bad request.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@ApiResponse({ status: 403, description: 'Forbidden.' })
	@ApiResponse({ status: 404, description: 'Not found.' })
	async create(@Body() createProductDto: CreateProductDto) {
		return await this.productService.createProduct(createProductDto);
	}

	@Patch()
	@ApiOperation({ summary: 'Update an existing product' })
	@ApiResponse({ status: 200, description: 'The product has been successfully updated.' })
	@ApiResponse({ status: 400, description: 'Bad request.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@ApiResponse({ status: 403, description: 'Forbidden.' })
	@ApiResponse({ status: 404, description: 'Not found.' })
	async update(@Body() updateProductDto: UpdateProductDto) {
		return await this.productService.updateProduct(updateProductDto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a product' })
	@ApiResponse({ status: 200, description: 'The product has been successfully deleted.' })
	@ApiResponse({ status: 400, description: 'Bad request.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@ApiResponse({ status: 403, description: 'Forbidden.' })
	@ApiResponse({ status: 404, description: 'Not found.' })
	async delete(@Param('id', ParseIntPipe) id: number) {
		return await this.productService.deleteProduct(id);
	}
}
