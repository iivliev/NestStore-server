export type InsertRefreshTokenParams = {
	userId: number;
	refreshToken: string;
	agent: string | null;
};

export type SignTokenPayload<T> = {
	sub: number;
	expiresIn: number;
	secret: string;
	payload?: T;
};
