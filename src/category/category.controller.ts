import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { RolesGuard } from 'src/auth/guards/user-role/role.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Category')
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@Controller('category')
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new category' })
	@ApiResponse({ status: 201, description: 'The category has been successfully created.' })
	@ApiResponse({ status: 400, description: 'Bad request.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@ApiResponse({ status: 403, description: 'Forbidden.' })
	@ApiResponse({ status: 404, description: 'Not found.' })
	async create(@Body() createCategoryDto: CreateCategoryDto) {
		return await this.categoryService.createCategory(createCategoryDto);
	}

	@Patch()
	@ApiOperation({ summary: 'Update an existing category' })
	@ApiResponse({ status: 200, description: 'The category has been successfully updated.' })
	@ApiResponse({ status: 400, description: 'Bad request.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@ApiResponse({ status: 403, description: 'Forbidden.' })
	@ApiResponse({ status: 404, description: 'Not found.' })
	async update(@Body() updateCategoryDto: UpdateCategoryDto) {
		return await this.categoryService.updateCategory(updateCategoryDto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a category' })
	@ApiResponse({ status: 200, description: 'The category has been successfully deleted.' })
	@ApiResponse({ status: 400, description: 'Bad request.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	@ApiResponse({ status: 403, description: 'Forbidden.' })
	@ApiResponse({ status: 404, description: 'Not found.' })
	async delete(@Param('id', ParseIntPipe) id: number) {
		return await this.categoryService.deleteCategory(id);
	}
}
