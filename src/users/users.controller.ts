import {
	Controller,
	Get,
	Body,
	Patch,
	Param,
	Delete,
	Post,
	UseInterceptors,
	ClassSerializerInterceptor,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUserIdParamDto } from './dto/get-user-id-param.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@UseInterceptors(ClassSerializerInterceptor)
	create(@Body() createUserDto: CreateUserDto) {
		return this.usersService.create(createUserDto);
	}

	@Get(':id')
	@UseInterceptors(ClassSerializerInterceptor)
	getUsers(@Param() getUserParamDto: GetUserIdParamDto) {
		return this.usersService.findOneById(getUserParamDto.id);
	}

	@Patch(':id')
	@UseInterceptors(ClassSerializerInterceptor)
	update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
		return this.usersService.update(+id, updateUserDto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.usersService.remove(+id);
	}
}
