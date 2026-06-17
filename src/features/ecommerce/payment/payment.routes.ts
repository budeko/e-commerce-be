import { FastifyInstance } from 'fastify';
import { env } from '@/config/env';
import { validateBody } from '@/lib/common/http/validate-body';
import { handleRouteError } from '@/lib/common/http/handle-route-error';
import { orderIdParamSchema } from '@/lib/common/validation/param-schemas';
import { buyerOnly, buyerWithParams } from '@/features/ecommerce/core/routes/buyer-route-guards';
import {
  createPaymentSchema,
  type CreatePaymentInput,
} from '@/features/ecommerce/payment/create-payment.schema';
import {
  completePaymentFromCheckoutToken,
  createPaymentForOrder,
  getPaymentByOrderId,
} from '@/features/ecommerce/payment/payment.service';

const buyerWithOrderId = buyerWithParams(orderIdParamSchema);

const parseFormBody = (body: unknown): Record<string, string> => {
  if (typeof body === 'string') {
    return Object.fromEntries(new URLSearchParams(body));
  }

  if (typeof body === 'object' && body !== null) {
    return Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, String(value)])
    );
  }

  return {};
};

export default async function paymentRoutes(fastify: FastifyInstance) {
  fastify.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    (_request, body, done) => {
      done(null, body);
    }
  );

  fastify.post(
    '/',
    { preHandler: [...buyerOnly.preHandler, validateBody(createPaymentSchema)] },
    async (req, reply) => {
      try {
        const result = await createPaymentForOrder(
          req.auth!.userId,
          req.body as CreatePaymentInput,
          { clientIp: req.ip }
        );

        return reply.status(201).send({
          message: 'Ödeme sayfasına yönlendiriliyorsunuz',
          payment: result.payment,
          checkout: result.checkout,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Ödeme işlemi sırasında bir hata oluştu', {
          duplicateKeyMessage: 'Bu sipariş için ödeme kaydı zaten var',
        });
      }
    }
  );

  fastify.post('/callback', async (req, reply) => {
    try {
      const form = parseFormBody(req.body);
      const token = form.token?.trim();

      if (!token) {
        return reply.status(400).send({ message: 'Ödeme token bilgisi eksik' });
      }

      const result = await completePaymentFromCheckoutToken(token);
      const frontendUrl = env.frontendUrlOrDefault.replace(/\/+$/, '');

      if (!result.success) {
        const redirectUrl = `${frontendUrl}/orders/${result.payment.orderId}?payment=failed`;
        return reply.redirect(redirectUrl);
      }

      const redirectUrl = `${frontendUrl}/orders/${result.payment.orderId}?payment=success`;
      return reply.redirect(redirectUrl);
    } catch (error) {
      return handleRouteError(reply, error, 'Ödeme doğrulama sırasında bir hata oluştu');
    }
  });

  fastify.get('/order/:orderId', buyerWithOrderId, async (req, reply) => {
    try {
      const { orderId } = req.params as { orderId: string };
      const payment = await getPaymentByOrderId(req.auth!.userId, orderId);

      return reply.status(200).send({ payment });
    } catch (error) {
      return handleRouteError(reply, error, 'Ödeme işlemi sırasında bir hata oluştu');
    }
  });
}
