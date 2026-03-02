import { User } from 'src/users/entities/user.entity';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RefreshToken {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
	user: User;

	@Index()
	@Column()
	refreshToken: string;

	@Column({ type: 'text', nullable: true })
	agent: string | null;

	@Column()
	expiresAt: Date;

	@CreateDateColumn()
	createdAt: Date;

	@Column({ type: 'timestamp', nullable: true })
	revokedAt: Date | null;
}
