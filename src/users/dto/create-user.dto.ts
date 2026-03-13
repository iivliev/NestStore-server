import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
	@ApiProperty({
		description: 'User email address',
		example: 'user@example.com',
	})
	@IsEmail()
	@IsNotEmpty()
	@MaxLength(96)
	email: string;

	@ApiProperty({
		description: 'User name',
		example: 'John Doe',
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	@MaxLength(96)
	name: string;

	@ApiProperty({
		description: 'User password',
		example: 'Password123',
	})
	@IsString()
	@IsOptional()
	@MinLength(6)
	@MaxLength(96)
	@Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, {
		message: 'Password must be at least 6 characters long and contain at least one letter and one number',
	})
	password?: string | null;
}
