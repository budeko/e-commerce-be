import { FastifyInstance } from 'fastify';
import { requireAuth } from '@/features/auth/core/guard/require-auth';
import { requireEmailVerified } from '@/features/auth/core/guard/require-email-verified';
import { requireApprovedSeller } from '@/lib/ecommerce/guards/require-approved-seller';
import { validateBody } from '@/lib/common/http/validate-body';
import { validateParams } from '@/lib/common/http/validate-params';
import { orderIdParamSchema } from '@/lib/common/validation/param-schemas';
import { handleRouteError } from '@/lib/common/http/handle-route-error';
import { buyerOnly, buyerWithParams } from '@/features/ecommerce/core/routes/buyer-route-guards';
import { createOrderSchema } from '@/features/ecommerce/order/create-order.schema';
import {
  updateOrderStatusSchema,
  type UpdateOrderStatusInput,
} from '@/features/ecommerce/order/update-order-status.schema';
import {
  createOrderFromCart,
  getBuyerOrderById,
  getSellerOrderById,
  listBuyerOrders,
  listSellerOrders,
  updateOrderStatus,
} from '@/features/ecommerce/order/order.service';

const buyerWithOrderId = buyerWithParams(orderIdParamSchema);

const sellerOnly = {
  preHandler: [requireAuth, requireEmailVerified, requireApprovedSeller],
};

const sellerWithOrderId = {
  preHandler: [
    requireAuth,
    requireEmailVerified,
    requireApprovedSeller,
    validateParams(orderIdParamSchema),
  ],
};

export default async function orderRoutes(fastify: FastifyInstance) {
  fastify.get('/', buyerOnly, async (req, reply) => {
    try {
      const orders = await listBuyerOrders(req.auth!.userId);
      return reply.status(200).send({ orders });
    } catch (error) {
      return handleRouteError(reply, error, 'Sipariş işlemi sırasında bir hata oluştu');
    }
  });

  fastify.get('/seller', sellerOnly, async (req, reply) => {
    try {
      const orders = await listSellerOrders(req.auth!.userId);
      return reply.status(200).send({ orders });
    } catch (error) {
      return handleRouteError(reply, error, 'Sipariş işlemi sırasında bir hata oluştu');
    }
  });

  fastify.post(
    '/',
    { preHandler: [...buyerOnly.preHandler, validateBody(createOrderSchema)] },
    async (req, reply) => {
      try {
        const order = await createOrderFromCart(req.auth!.userId);

        return reply.status(201).send({
          message: 'Sipariş oluşturuldu',
          order,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Sipariş işlemi sırasında bir hata oluştu');
      }
    }
  );

  fastify.get('/seller/:orderId', sellerWithOrderId, async (req, reply) => {
    try {
      const { orderId } = req.params as { orderId: string };
      const order = await getSellerOrderById(req.auth!.userId, orderId);
      return reply.status(200).send({ order });
    } catch (error) {
      return handleRouteError(reply, error, 'Sipariş işlemi sırasında bir hata oluştu');
    }
  });

  fastify.get('/:orderId', buyerWithOrderId, async (req, reply) => {
    try {
      const { orderId } = req.params as { orderId: string };
      const order = await getBuyerOrderById(req.auth!.userId, orderId);
      return reply.status(200).send({ order });
    } catch (error) {
      return handleRouteError(reply, error, 'Sipariş işlemi sırasında bir hata oluştu');
    }
  });

  fastify.patch(
    '/:orderId/status',
    {
      preHandler: [...sellerWithOrderId.preHandler, validateBody(updateOrderStatusSchema)],
    },
    async (req, reply) => {
      try {
        const { orderId } = req.params as { orderId: string };
        const order = await updateOrderStatus(
          req.auth!.userId,
          orderId,
          req.body as UpdateOrderStatusInput
        );

        return reply.status(200).send({
          message: 'Sipariş durumu güncellendi',
          order,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Sipariş işlemi sırasında bir hata oluştu');
      }
    }
  );
}
