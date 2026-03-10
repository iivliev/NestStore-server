import { User } from 'src/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AuthProviderType } from '../enums/auth-type.enum';

@Entity()
@Index(['provider', 'providerId'], { unique: true })
export class AuthProvider {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, (user) => user.authProviders, { onDelete: 'CASCADE' })
	user: User;

	@Column({ type: 'enum', enum: AuthProviderType })
	provider: AuthProviderType;

	@Column()
	providerId: string;

	@CreateDateColumn()
	createdAt: Date;
}
