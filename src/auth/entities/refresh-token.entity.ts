import { User } from 'src/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RefreshToken {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@Column()
	hashedToken: string;

	@Column({ type: 'text', nullable: true })
	agent: string | null;

	@Column({ name: 'expires_at' })
	expiresAt: Date;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
	revokedAt: Date | null;
}
