import { SignInUserDto } from './sign-in-user.dto';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpUserDto extends SignInUserDto {
	@ApiProperty({
		description: 'User name',
		example: 'John Doe',
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	@MaxLength(96)
	name: string;
}
