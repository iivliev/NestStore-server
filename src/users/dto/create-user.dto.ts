import { Exclude } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
	@IsEmail()
	@IsNotEmpty()
	@MaxLength(96)
	email: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	@MaxLength(96)
	name: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(6)
	@MaxLength(96)
	@Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, {
		message: 'Password must be at least 6 characters long and contain at least one letter and one number',
	})
	password: string;
}
