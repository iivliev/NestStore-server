import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetUserIdParamDto {
	@IsInt()
	@Type(() => Number)
	id: number;
}
