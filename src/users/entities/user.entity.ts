import { Exclude } from 'class-transformer';
import { AuthProvider } from 'src/auth/entities/auth-providers.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	email: string;

	@Column()
	name: string;

	@Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
	role: UserRole;

	@Column({ type: 'varchar', nullable: true })
	@Exclude()
	password?: string | null;

	@Column({ default: false })
	confirmed: boolean;

	@OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
	refreshTokens: RefreshToken[];

	@OneToMany(() => AuthProvider, (authProvider) => authProvider.user)
	authProviders: AuthProvider[];
}
