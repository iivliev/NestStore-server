export interface JwtPayload {
	sub: number;
}

export interface JwtDecoded extends JwtPayload {
	iat: number;
	exp: number;
}
