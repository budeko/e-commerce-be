import { FastifyInstance } from 'fastify';
import productRoutes from '@/features/ecommerce/product/product.routes';
import cartRoutes from '@/features/ecommerce/cart/cart.routes';
import orderRoutes from '@/features/ecommerce/order/order.routes';
import paymentRoutes from '@/features/ecommerce/payment/payment.routes';

export default async function ecommerceRoutes(fastify: FastifyInstance) {
  await fastify.register(productRoutes, { prefix: '/products' });
  await fastify.register(cartRoutes, { prefix: '/cart' });
  await fastify.register(orderRoutes, { prefix: '/orders' });
  await fastify.register(paymentRoutes, { prefix: '/payments' });
}
