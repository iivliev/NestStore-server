import { UserRole } from 'src/users/enums/user-role.enum';

export interface JwtPayload {
	sub: number;
	role?: UserRole;
}

export interface JwtDecoded extends JwtPayload {
	iat: number;
	exp: number;
}
