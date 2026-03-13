import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { HashingProvider } from 'src/infrastructure/security/hashing/hashing.provider';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
	let service: UsersService;

	const mockUsersRepository = {
		create: jest.fn(),
		save: jest.fn(),
		find: jest.fn(),
		findOneBy: jest.fn(),
		delete: jest.fn(),
	};

	const mockHashingProvider = {
		hash: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: getRepositoryToken(User),
					useValue: mockUsersRepository,
				},
				{
					provide: HashingProvider,
					useValue: mockHashingProvider,
				},
			],
		}).compile();

		service = module.get<UsersService>(UsersService);

		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a new user with hashed password', async () => {
			const createUserDto: CreateUserDto = {
				email: 'test@example.com',
				name: 'Test User',
				password: 'password123',
			};

			const createdUser = {
				id: 1,
				...createUserDto,
				confirmed: false,
			};

			mockUsersRepository.findOneBy.mockResolvedValue(null);
			mockUsersRepository.save.mockResolvedValue(createdUser);

			const result = await service.create(createUserDto);

			expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({ email: createUserDto.email });
			expect(mockUsersRepository.save).toHaveBeenCalledWith(createUserDto);
			expect(result).toEqual(createdUser);
		});

		it('should throw BadRequestException when user with email already exists', async () => {
			const createUserDto: CreateUserDto = {
				email: 'existing@example.com',
				name: 'Test User',
				password: 'password123',
			};

			const existingUser = {
				id: 1,
				email: createUserDto.email,
				name: 'Existing User',
				password: 'hashed',
			};

			mockUsersRepository.findOneBy.mockResolvedValue(existingUser);

			await expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
			await expect(service.create(createUserDto)).rejects.toThrow(
				`User with email ${createUserDto.email} already exists`,
			);
			expect(mockHashingProvider.hash).not.toHaveBeenCalled();

			expect(mockUsersRepository.save).not.toHaveBeenCalled();
		});
	});

	describe('findAll', () => {
		it('should return an array of users', async () => {
			const users = [
				{ id: 1, email: 'user1@example.com', name: 'User 1', password: 'hashed1', confirmed: false },
				{ id: 2, email: 'user2@example.com', name: 'User 2', password: 'hashed2', confirmed: true },
			];

			mockUsersRepository.find.mockResolvedValue(users);

			const result = await service.findAll();

			expect(mockUsersRepository.find).toHaveBeenCalled();
			expect(result).toEqual(users);
		});

		it('should return an empty array when no users exist', async () => {
			mockUsersRepository.find.mockResolvedValue([]);

			const result = await service.findAll();

			expect(result).toEqual([]);
		});
	});

	describe('findOneById', () => {
		it('should return a user by id', async () => {
			const user = {
				id: 1,
				email: 'test@example.com',
				name: 'Test User',
				password: 'hashed',
				confirmed: false,
			};

			mockUsersRepository.findOneBy.mockResolvedValue(user);

			const result = await service.findOneById(1);

			expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
			expect(result).toEqual(user);
		});

		it('should return null when user is not found', async () => {
			mockUsersRepository.findOneBy.mockResolvedValue(null);

			const result = await service.findOneById(999);

			expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
			expect(result).toBeNull();
		});
	});

	describe('findOneByEmail', () => {
		it('should return a user by email', async () => {
			const user = {
				id: 1,
				email: 'test@example.com',
				name: 'Test User',
				password: 'hashed',
				confirmed: false,
			};

			mockUsersRepository.findOneBy.mockResolvedValue(user);

			const result = await service.findOneByEmail('test@example.com');

			expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
			expect(result).toEqual(user);
		});

		it('should return null when user with email is not found', async () => {
			mockUsersRepository.findOneBy.mockResolvedValue(null);

			const result = await service.findOneByEmail('nonexistent@example.com');

			expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
			expect(result).toBeNull();
		});
	});

	describe('update', () => {
		it('should update user with all fields', async () => {
			const userId = 1;
			const updateUserDto: UpdateUserDto = {
				email: 'updated@example.com',
				name: 'Updated Name',
				password: 'newPassword123',
			};

			const existingUser = {
				id: userId,
				email: 'old@example.com',
				name: 'Old Name',
				password: 'old_hashed',
				confirmed: false,
			};

			const hashedNewPassword = 'hashed_new_password';
			const updatedUser = {
				...existingUser,
				...updateUserDto,
				password: hashedNewPassword,
			};

			mockUsersRepository.findOneBy.mockResolvedValue(existingUser);
			mockHashingProvider.hash.mockResolvedValue(hashedNewPassword);
			mockUsersRepository.save.mockResolvedValue(updatedUser);

			const result = await service.update(userId, updateUserDto);

			expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
			expect(mockHashingProvider.hash).toHaveBeenCalledWith(updateUserDto.password);
			expect(mockUsersRepository.save).toHaveBeenCalled();
			expect(result.email).toBe(updateUserDto.email);
			expect(result.name).toBe(updateUserDto.name);
			expect(result.password).toBe(hashedNewPassword);
		});

		it('should update only name when only name is provided', async () => {
			const userId = 1;
			const updateUserDto: UpdateUserDto = {
				name: 'New Name Only',
			};

			const existingUser = {
				id: userId,
				email: 'test@example.com',
				name: 'Old Name',
				password: 'old_hashed',
				confirmed: false,
			};

			const updatedUser = {
				...existingUser,
				name: updateUserDto.name,
			};

			mockUsersRepository.findOneBy.mockResolvedValue(existingUser);
			mockUsersRepository.save.mockResolvedValue(updatedUser);

			const result = await service.update(userId, updateUserDto);

			expect(result.name).toBe(updateUserDto.name);
			expect(result.email).toBe(existingUser.email);
			expect(result.password).toBe(existingUser.password);
			expect(mockHashingProvider.hash).not.toHaveBeenCalled();
		});

		it('should update password and hash it when password is provided', async () => {
			const userId = 1;
			const updateUserDto: UpdateUserDto = {
				password: 'newSecurePassword123',
			};

			const existingUser = {
				id: userId,
				email: 'test@example.com',
				name: 'Test User',
				password: 'old_hashed',
				confirmed: false,
			};

			const hashedNewPassword = 'hashed_new_secure_password';
			const updatedUser = {
				...existingUser,
				password: hashedNewPassword,
			};

			mockUsersRepository.findOneBy.mockResolvedValue(existingUser);
			mockHashingProvider.hash.mockResolvedValue(hashedNewPassword);
			mockUsersRepository.save.mockResolvedValue(updatedUser);

			const result = await service.update(userId, updateUserDto);

			expect(mockHashingProvider.hash).toHaveBeenCalledWith(updateUserDto.password);
			expect(result.password).toBe(hashedNewPassword);
		});

		it('should throw BadRequestException when user not found', async () => {
			const userId = 999;
			const updateUserDto: UpdateUserDto = {
				name: 'New Name',
			};

			mockUsersRepository.findOneBy.mockResolvedValue(null);

			await expect(service.update(userId, updateUserDto)).rejects.toThrow(BadRequestException);
			await expect(service.update(userId, updateUserDto)).rejects.toThrow(`User with id ${userId} not found`);
			expect(mockUsersRepository.save).not.toHaveBeenCalled();
		});

		it('should keep existing values when fields are not provided', async () => {
			const userId = 1;
			const updateUserDto: UpdateUserDto = {};

			const existingUser = {
				id: userId,
				email: 'test@example.com',
				name: 'Test User',
				password: 'hashed',
				confirmed: false,
			};

			mockUsersRepository.findOneBy.mockResolvedValue(existingUser);
			mockUsersRepository.save.mockResolvedValue(existingUser);

			const result = await service.update(userId, updateUserDto);

			expect(result).toEqual(existingUser);
			expect(mockHashingProvider.hash).not.toHaveBeenCalled();
		});
	});

	describe('remove', () => {
		it('should delete a user by id', async () => {
			const userId = 1;

			mockUsersRepository.delete.mockResolvedValue({ affected: 1 });

			const result = await service.remove(userId);

			expect(mockUsersRepository.delete).toHaveBeenCalledWith({ id: userId });
			expect(result).toEqual({ message: `User with id ${userId} has been removed` });
		});

		it('should throw BadRequestException when user does not exist', async () => {
			const userId = 999;

			mockUsersRepository.delete.mockResolvedValue({ affected: 0 });

			await expect(service.remove(userId)).rejects.toThrow(BadRequestException);
			await expect(service.remove(userId)).rejects.toThrow(`User with id ${userId} not found`);
			expect(mockUsersRepository.delete).toHaveBeenCalledWith({ id: userId });
		});
	});
});
