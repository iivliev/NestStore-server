import { Category } from 'src/category/entities/category.entity';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
	JoinColumn,
} from 'typeorm';

@Entity('products')
export class Product {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ length: 255 })
	name: string;

	@Index({ unique: true })
	@Column({ length: 255 })
	slug: string;

	@Column({ type: 'text', nullable: true })
	description?: string;

	@Column({ type: 'numeric', precision: 10, scale: 2 })
	price: string;

	@Column({ length: 10, default: 'USD' })
	currency: string;

	@Column({ default: 0 })
	stock: number;

	@Column({ name: 'is_active', default: true })
	isActive: boolean;

	@ManyToOne(() => Category, (category) => category.products, {
		nullable: true,
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'category_id' })
	category?: Category;

	@Column({ type: 'text', array: true, default: [] })
	images: string[];

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;
}
