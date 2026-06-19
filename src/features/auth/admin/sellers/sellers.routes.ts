import { FastifyInstance } from 'fastify';
import { requireAuth } from '@/features/auth/core/guard/require-auth';
import { requireAdmin, requirePermission } from '@/features/auth/core/guard/require-admin';
import { validateBody } from '@/plugins/http/validate-body';
import { validateParams } from '@/plugins/http/validate-params';
import { validateQuery } from '@/plugins/http/validate-query';
import { userIdParamSchema } from '@/internal/validation/param-schemas';
import { handleRouteError } from '@/plugins/http/handle-route-error';
import { PERMISSIONS } from '@/features/auth/admin/access/permission-keys';
import { listSellersQuerySchema, type ListSellersQuery } from '@/features/auth/admin/sellers/list-sellers.schema';
import { rejectSellerSchema, type RejectSellerInput } from '@/features/auth/admin/sellers/reject-seller.schema';
import {
  approveSeller,
  getSellerByUserId,
  listSellers,
  rejectSeller,
  syncSellerIyzicoSubMerchant,
} from '@/features/auth/admin/sellers/sellers.service';

const adminOnly = { preHandler: [requireAuth, requireAdmin] };
const adminWithUserId = {
  preHandler: [requireAuth, requireAdmin, validateParams(userIdParamSchema)],
};

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      preHandler: [
        ...adminOnly.preHandler,
        requirePermission(PERMISSIONS.SELLERS_READ),
        validateQuery(listSellersQuerySchema),
      ],
    },
    async (req, reply) => {
      try {
        const { status } = req.query as ListSellersQuery;
        const sellers = await listSellers(req.adminContext!, status);
        return reply.status(200).send({ sellers });
      } catch (error) {
        return handleRouteError(reply, error, 'Satıcı işlemi sırasında bir hata oluştu');
      }
    }
  );

  fastify.get(
    '/:userId',
    {
      preHandler: [
        ...adminWithUserId.preHandler,
        requirePermission(PERMISSIONS.SELLERS_READ),
      ],
    },
    async (req, reply) => {
      try {
        const { userId } = req.params as { userId: string };
        const seller = await getSellerByUserId(req.adminContext!, userId);
        return reply.status(200).send(seller);
      } catch (error) {
        return handleRouteError(reply, error, 'Satıcı işlemi sırasında bir hata oluştu');
      }
    }
  );

  fastify.post(
    '/:userId/approve',
    {
      preHandler: [
        ...adminWithUserId.preHandler,
        requirePermission(PERMISSIONS.SELLERS_APPROVE),
      ],
    },
    async (req, reply) => {
      try {
        const { userId } = req.params as { userId: string };
        const result = await approveSeller(req.adminContext!, userId);

        return reply.status(200).send({
          message: 'Satıcı onaylandı',
          ...result,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Satıcı işlemi sırasında bir hata oluştu');
      }
    }
  );

  fastify.post(
    '/:userId/iyzico-sync',
    {
      preHandler: [
        ...adminWithUserId.preHandler,
        requirePermission(PERMISSIONS.SELLERS_APPROVE),
      ],
    },
    async (req, reply) => {
      try {
        const { userId } = req.params as { userId: string };
        const result = await syncSellerIyzicoSubMerchant(req.adminContext!, userId);

        return reply.status(200).send({
          message: result.created
            ? 'Iyzico alt üye kaydı oluşturuldu'
            : 'Satıcının Iyzico alt üye kaydı zaten mevcut',
          ...result,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Iyzico kaydı sırasında bir hata oluştu');
      }
    }
  );

  fastify.post(
    '/:userId/reject',
    {
      preHandler: [
        requireAuth,
        requireAdmin,
        requirePermission(PERMISSIONS.SELLERS_APPROVE),
        validateParams(userIdParamSchema),
        validateBody(rejectSellerSchema),
      ],
    },
    async (req, reply) => {
      try {
        const { userId } = req.params as { userId: string };
        const { reason } = req.body as RejectSellerInput;
        const result = await rejectSeller(req.adminContext!, userId, reason);

        return reply.status(200).send({
          message: 'Satıcı reddedildi',
          ...result,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Satıcı işlemi sırasında bir hata oluştu');
      }
    }
  );
}
