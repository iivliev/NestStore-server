import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';

export class CreateProductDto {
	@ApiProperty({
		description: 'Name of the product',
		example: 'Samsung Galaxy S23',
	})
	@Trim()
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	name: string;

	@ApiProperty({
		description: 'Unique slug for the product',
		example: 'samsung-galaxy-s23',
	})
	@Trim()
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	slug: string;

	@ApiProperty({
		description: 'Description of the product',
		example: 'The latest Samsung Galaxy S23 with cutting-edge features and sleek design.',
	})
	@Trim()
	@IsString()
	@IsNotEmpty()
	@MinLength(10)
	@IsOptional()
	description?: string;

	@ApiProperty({
		description: 'Price of the product',
		example: '799.99',
	})
	@Trim()
	@IsString()
	@IsNotEmpty()
	price: string;

	@ApiProperty({
		description: 'Currency of the price',
		example: 'USD',
	})
	@Trim()
	@IsString()
	@IsOptional()
	currency?: string;

	@ApiProperty({
		description: 'Stock quantity of the product',
		example: 100,
	})
	@IsNumber()
	@IsOptional()
	stock?: number;

	@ApiProperty({
		description: 'Whether the product is active and available for purchase',
		example: true,
	})
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;

	@ApiProperty({
		description: 'ID of the category the product belongs to',
		example: 1,
	})
	@IsNumber()
	@IsOptional()
	@Min(1)
	categoryId?: number;

	@ApiProperty({
		description: 'Array of image URLs for the product',
		example: ['https://example.com/images/product1.jpg', 'https://example.com/images/product2.jpg'],
	})
	@IsString({ each: true })
	@IsOptional()
	images?: string[];
}
