import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
	constructor(
		@InjectRepository(Category)
		private readonly categoryRepository: Repository<Category>,
	) {}

	async createCategory({ parentId, ...data }: CreateCategoryDto) {
		const newCategory = this.categoryRepository.create(data);

		if (parentId) {
			const parent = await this.getCategoryById(parentId);
			if (!parent) {
				throw new NotFoundException(`Parent category not found with id ${parentId}`);
			}
			newCategory.parent = parent;
		}

		return await this.categoryRepository.save(newCategory);
	}

	async getCategoryById(id: number) {
		return await this.categoryRepository.findOneBy({ id });
	}

	async updateCategory(updateCategoryDto: UpdateCategoryDto) {
		const category = await this.getCategoryById(updateCategoryDto.id);

		if (!category) {
			throw new NotFoundException(`Category with id ${updateCategoryDto.id} not found`);
		}

		category.name = updateCategoryDto.name ?? category.name;
		category.slug = updateCategoryDto.slug ?? category.slug;
		category.description = updateCategoryDto.description ?? category.description;

		if (updateCategoryDto.parentId !== undefined) {
			if (updateCategoryDto.parentId === null) {
				category.parent = null;
			} else {
				const parent = await this.getCategoryById(updateCategoryDto.parentId);
				if (!parent) {
					throw new NotFoundException(`Parent category with id ${updateCategoryDto.parentId} not found`);
				}
				category.parent = parent;
			}
		}

		return await this.categoryRepository.save(category);
	}

	async deleteCategory(id: number) {
		const result = await this.categoryRepository.delete({ id });

		if (result.affected === 0) {
			throw new NotFoundException(`Category with id ${id} not found`);
		}

		return { message: `Category with id ${id} deleted successfully` };
	}
}
