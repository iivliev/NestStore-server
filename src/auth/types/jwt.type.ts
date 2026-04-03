type AuthContext = {
	userId: number;
};

type RequestMeta = {
	agent: string | null;
};

type BaseRefreshTokenParams = AuthContext &
	RequestMeta & {
		refreshToken: string;
	};

export type InsertRefreshTokenParams = BaseRefreshTokenParams;

export type RefreshTokensParams = BaseRefreshTokenParams;

export type GenerateAndStoreTokensParams = AuthContext & RequestMeta;

export type SignTokenPayload<T> = {
	sub: number;
	expiresIn: number;
	secret: string;
	payload?: T;
};
