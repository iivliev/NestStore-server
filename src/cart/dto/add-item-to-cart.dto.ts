import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class AddItemToCartDto {
	@ApiProperty({ description: 'ID of the product to add to the cart', example: 1 })
	@IsNumber()
	productId: number;
	@ApiProperty({ description: 'Quantity of the product to add to the cart', example: 1 })
	@IsNumber()
	quantity: number;
}
