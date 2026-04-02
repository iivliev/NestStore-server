import { UserRole } from 'src/users/enums/user-role.enum';

type AuthContext = {
	userId: number;
	role: UserRole;
};

type RequestMeta = {
	agent: string | null;
};

type BaseRefreshTokenParams = Omit<AuthContext, 'role'> &
	RequestMeta & {
		refreshToken: string;
	};

export type InsertRefreshTokenParams = BaseRefreshTokenParams;

export type RefreshTokensParams = BaseRefreshTokenParams;

export type GenerateAndStoreTokensParams = AuthContext & RequestMeta;

export type SignTokenPayload<T> = {
	sub: number;
	role?: UserRole;
	expiresIn: number;
	secret: string;
	payload?: T;
};
