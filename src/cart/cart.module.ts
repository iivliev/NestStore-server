import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from 'src/product/product.service';

@Module({
	imports: [TypeOrmModule.forFeature([Cart, CartItem]), ProductService],
	controllers: [CartController],
	providers: [CartService],
})
export class CartModule {}
