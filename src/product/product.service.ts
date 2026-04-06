import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { CategoryService } from 'src/category/category.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { ProductSortField } from './enums/product.enum';
import { ALLOWED_SORT_FIELDS } from './constants/product.constant';

@Injectable()
export class ProductService {
	constructor(
		@InjectRepository(Product)
		private readonly productRepository: Repository<Product>,

		private readonly categoryService: CategoryService,
	) {}

	async createProduct({ categoryId, ...data }: CreateProductDto) {
		const product = this.productRepository.create(data);

		if (categoryId) {
			const category = await this.categoryService.getCategoryById(categoryId);
			if (!category) {
				throw new NotFoundException(`Category with id ${categoryId} not found`);
			}
			product.category = category;
		}

		return await this.productRepository.save(product);
	}

	async getProductById(id: number) {
		return await this.productRepository.findOneBy({ id });
	}

	async updateProduct(updateProductDto: UpdateProductDto) {
		const product = await this.getProductById(updateProductDto.id);

		if (!product) {
			throw new NotFoundException(`Product with id ${updateProductDto.id} not found`);
		}

		product.name = updateProductDto.name ?? product.name;
		product.slug = updateProductDto.slug ?? product.slug;
		product.description = updateProductDto.description ?? product.description;
		product.price = updateProductDto.price ?? product.price;
		product.currency = updateProductDto.currency ?? product.currency;
		product.stock = updateProductDto.stock ?? product.stock;
		product.isActive = updateProductDto.isActive ?? product.isActive;
		product.images = updateProductDto.images ?? product.images;

		if (updateProductDto.categoryId !== undefined) {
			if (updateProductDto.categoryId === null) {
				product.category = null;
			} else {
				const category = await this.categoryService.getCategoryById(updateProductDto.categoryId);
				if (!category) {
					throw new NotFoundException(`Category with id ${updateProductDto.categoryId} not found`);
				}
				product.category = category;
			}
		}

		return await this.productRepository.save(product);
	}

	async deleteProduct(id: number) {
		const result = await this.productRepository.delete({ id });

		if (result.affected === 0) {
			throw new NotFoundException(`Product with id ${id} not found`);
		}

		return { message: `Product with id ${id} deleted successfully` };
	}

	async findAll(filters: GetProductsDto) {
		const {
			categoryId,
			search,
			minPrice,
			maxPrice,
			page = 1,
			limit = 10,
			sortBy = ProductSortField.CREATED_AT,
			order = 'DESC',
		} = filters;

		const query = this.productRepository.createQueryBuilder('product');

		if (categoryId) {
			query.andWhere('product.category_id = :categoryId', { categoryId });
		}

		if (search) {
			query.andWhere('product.name ILIKE :search OR product.description ILIKE :search', { search: `%${search}%` });
		}

		if (minPrice) {
			query.andWhere('product.price >= :minPrice', { minPrice });
		}

		if (maxPrice) {
			query.andWhere('product.price <= :maxPrice', { maxPrice });
		}

		const total = await query.getCount();

		const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : ProductSortField.CREATED_AT;

		const items = await query
			.orderBy(`product.${safeSortBy}`, order)
			.skip((page - 1) * limit)
			.take(limit)
			.getMany();

		return { items, total, page, limit };
	}
}
