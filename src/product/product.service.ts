import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { CategoryService } from 'src/category/category.service';
import { UpdateProductDto } from './dto/update-product.dto';

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
}
