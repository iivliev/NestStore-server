import { Injectable, NotFoundException } from '@nestjs/common';
import { Cart } from './entities/cart.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddItemToCartDto } from './dto/add-item-to-cart.dto';
import { CartItem } from './entities/cart-item.entity';
import { ProductService } from 'src/product/product.service';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
	constructor(
		@InjectRepository(Cart)
		private readonly cartRepository: Repository<Cart>,

		@InjectRepository(CartItem)
		private readonly cartItemRepository: Repository<CartItem>,

		private readonly productService: ProductService,
	) {}

	async getOrCreateCart(userId: number): Promise<Cart> {
		let cart = await this.cartRepository.findOne({ where: { userId }, relations: ['items'] });
		if (!cart) {
			cart = this.cartRepository.create({ userId, items: [] });
			await this.cartRepository.save(cart);
		}
		return cart;
	}

	async addItemToCart(userId: number, { productId, quantity }: AddItemToCartDto) {
		const cart = await this.getOrCreateCart(userId);

		const existingItem = await this.cartItemRepository.findOne({
			where: { cartId: cart.id, productId },
		});

		if (existingItem) {
			existingItem.quantity += quantity;
			return await this.cartItemRepository.save(existingItem);
		}

		const product = await this.productService.getProductById(productId);

		if (!product) {
			throw new NotFoundException('Product not found');
		}

		const item = this.cartItemRepository.create({
			cartId: cart.id,
			productId,
			quantity,
			priceAtMoment: product.price,
		});

		return await this.cartItemRepository.save(item);
	}

	async updateCartItem(userId: number, { itemId, quantity }: UpdateCartItemDto) {
		const cartItem = await this.cartItemRepository.findOne({
			where: { id: itemId },
			relations: ['cart'],
		});

		if (!cartItem || cartItem.cart.userId !== userId) {
			throw new NotFoundException('Cart item not found');
		}

		cartItem.quantity = quantity;
		return await this.cartItemRepository.save(cartItem);
	}

	async removeCartItem(userId: number, itemId: number) {
		const cartItem = await this.cartItemRepository.findOne({
			where: { id: itemId },
			relations: ['cart'],
		});

		if (!cartItem || cartItem.cart.userId !== userId) {
			throw new NotFoundException('Cart item not found');
		}

		await this.cartItemRepository.remove(cartItem);
	}
}
