import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Auth } from 'src/auth/decorators/auth/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Auth(AuthType.Public)
@Controller('category')
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	@Post()
	create(@Body() createCategoryDto: CreateCategoryDto) {
		return this.categoryService.createCategory(createCategoryDto);
	}

	@Patch()
	update(@Body() updateCategoryDto: UpdateCategoryDto) {
		return this.categoryService.updateCategory(updateCategoryDto);
	}

	@Delete(':id')
	delete(@Param('id', ParseIntPipe) id: number) {
		return this.categoryService.deleteCategory(id);
	}
}
