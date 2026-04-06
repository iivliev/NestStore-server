import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateCartItemDto {
	@ApiProperty({ description: 'ID of the cart item to update', example: 1 })
	@IsNumber()
	itemId: number;

	@ApiProperty({ description: 'New quantity of the product in the cart', example: 2 })
	@IsNumber()
	quantity: number;
}
