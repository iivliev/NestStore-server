import { User } from 'src/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AuthProviderType } from '../enums/auth-type.enum';

@Entity()
@Index(['provider', 'providerId'], { unique: true })
export class AuthProvider {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, (user) => user.authProviders, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@Column({ type: 'enum', enum: AuthProviderType })
	provider: AuthProviderType;

	@Column({ name: 'provider_id' })
	providerId: string;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;
}
