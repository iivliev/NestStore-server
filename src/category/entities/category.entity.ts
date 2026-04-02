import { Product } from 'src/product/entities/product.entity';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
	JoinColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ length: 255 })
	name: string;

	@Index({ unique: true })
	@Column({ length: 255 })
	slug: string;

	@Column({ type: 'text', nullable: true })
	description?: string;

	@ManyToOne(() => Category, (category) => category.children, {
		nullable: true,
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'parent_id' })
	parent?: Category | null;

	@OneToMany(() => Category, (category) => category.parent)
	children: Category[];

	@OneToMany(() => Product, (product) => product.category)
	products: Product[];

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;
}
