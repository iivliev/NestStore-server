export interface JwtPayload {
	sub: number;
	email?: string;
}

export interface JwtDecoded extends JwtPayload {
	iat: number;
	exp: number;
}
