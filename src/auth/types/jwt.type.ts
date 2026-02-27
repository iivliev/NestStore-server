import { User } from 'src/users/entities/user.entity';

export type InsertRefreshTokenParams = {
	user: User;
	refreshToken: string;
	agent: string | null;
};
