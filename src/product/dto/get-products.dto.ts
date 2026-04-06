import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { ProductSortField } from '../enums/product.enum';
import { Type } from 'class-transformer';

export class GetProductsDto {
	@ApiProperty({ required: false, description: 'Filter products by category ID', example: 1 })
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	categoryId?: number;

	@ApiProperty({ required: false, description: 'Search products by name or description', example: 'Laptop' })
	@IsOptional()
	@IsString()
	search?: string;

	@ApiProperty({ required: false, description: 'Minimum price for filtering products', example: 100 })
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	minPrice?: number;

	@ApiProperty({ required: false, description: 'Maximum price for filtering products', example: 1000 })
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	maxPrice?: number;

	@ApiProperty({ required: false, description: 'Page number for pagination', example: 1 })
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	page?: number = 1;

	@ApiProperty({ required: false, description: 'Number of products per page for pagination', example: 10 })
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	limit?: number = 10;

	@ApiProperty({
		required: false,
		enum: ProductSortField,
		example: ProductSortField.CREATED_AT,
	})
	@IsOptional()
	@IsEnum(ProductSortField)
	sortBy?: ProductSortField = ProductSortField.CREATED_AT;

	@ApiProperty({ required: false, description: 'Order of sorting', example: 'DESC' })
	@IsOptional()
	@IsString()
	order?: 'ASC' | 'DESC' = 'DESC';
}
