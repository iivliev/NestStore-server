import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { CategoryModule } from 'src/category/category.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { ProductAdminController } from './controllers/admin/product-admin.controller';
import { ProductPublicController } from './controllers/public/product-public.controller';

@Module({
	imports: [TypeOrmModule.forFeature([Product]), CategoryModule, AuthModule, UsersModule],
	controllers: [ProductAdminController, ProductPublicController],
	providers: [ProductService],
})
export class ProductModule {}
