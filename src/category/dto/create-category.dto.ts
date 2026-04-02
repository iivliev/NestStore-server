import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';

export class CreateCategoryDto {
	@ApiProperty({
		description: 'Name of the category',
		example: 'Electronics',
	})
	@Trim()
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	name: string;

	@ApiProperty({
		description: 'Unique slug for the category',
		example: 'electronics',
	})
	@Trim()
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	slug: string;

	@ApiProperty({
		description: 'Description of the category',
		example: 'All kinds of electronic devices and gadgets',
	})
	@Trim()
	@IsString()
	@IsNotEmpty()
	@MinLength(10)
	@IsOptional()
	description?: string;

	@ApiProperty({
		description: 'ID of the parent category (optional)',
		example: 1,
	})
	@Min(1)
	@IsOptional()
	parentId?: number;
}
