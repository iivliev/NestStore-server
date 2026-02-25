import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm/repository/Repository.js';
import { HashingProvider } from 'infrastructure/security/hashing/hashing.provider';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,

		private readonly hashingProvider: HashingProvider,
	) {}

	async create(createUserDto: CreateUserDto) {
		try {
			const hashedPassword = await this.hashingProvider.hash(createUserDto.password);

			const user = this.usersRepository.create({
				...createUserDto,
				password: hashedPassword,
			});

			return this.usersRepository.save(user);
		} catch (error) {
			if (error instanceof QueryFailedError) {
				return 'here';
			}
			throw error;
		}
	}

	findAll() {
		return this.usersRepository.find();
	}

	async findOneById(id: number) {
		return await this.usersRepository.findOneBy({ id });
	}

	async findOneByEmail(email: string) {
		return await this.usersRepository.findOneBy({ email });
	}

	async update(id: number, updateUserDto: UpdateUserDto) {
		const user = await this.findOneById(id);

		if (!user) {
			throw new BadRequestException(`User with id ${id} not found`);
		}

		user.name = updateUserDto.name ?? user.name;
		user.email = updateUserDto.email ?? user.email;
		user.password = updateUserDto.password ? await this.hashingProvider.hash(updateUserDto.password) : user.password;

		return await this.usersRepository.save(user);
	}

	async remove(id: number) {
		await this.usersRepository.delete({ id });

		return { message: `User with id ${id} has been removed` };
	}
}
