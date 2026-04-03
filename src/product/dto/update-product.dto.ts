import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsNumber } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
	@IsNumber()
	id: number;
}
