import { Controller } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Auth } from 'src/auth/decorators/auth/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';

@Auth(AuthType.Public)
@Controller('category')
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}
}
