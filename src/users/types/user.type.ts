import { CreateUserDto } from '../dto/create-user.dto';

export type CreateUserParams = CreateUserDto & {
	confirmed?: boolean;
};
