import { FastifyInstance } from 'fastify';
import { requireAuth } from '@/features/auth/core/guard/require-auth';
import { requireAdmin } from '@/features/auth/core/guard/require-admin';
import { validateBody } from '@/plugins/http/validate-body';
import { validateParams } from '@/plugins/http/validate-params';
import { userIdParamSchema } from '@/internal/validation/param-schemas';
import { handleRouteError } from '@/plugins/http/handle-route-error';
import {
  adminProfileUpdateSchema,
  type AdminProfileUpdateInput,
} from '@/features/auth/admin/profile/admin-profile-fields.schema';
import { getAdminProfile, updateAdminProfile } from '@/features/auth/admin/profile/profile.service';

const adminOnly = { preHandler: [requireAuth, requireAdmin] };

export default async function (fastify: FastifyInstance) {
  fastify.get('/', adminOnly, async (req, reply) => {
    try {
      if (!req.adminContext) {
        return reply.status(403).send({ message: 'Admin profili bulunamadı' });
      }

      const profile = await getAdminProfile(req.adminContext);
      return reply.status(200).send(profile);
    } catch (error) {
      return handleRouteError(reply, error, 'Admin profil işlemi sırasında bir hata oluştu');
    }
  });

  fastify.patch(
    '/',
    { preHandler: [...adminOnly.preHandler, validateBody(adminProfileUpdateSchema)] },
    async (req, reply) => {
      try {
        if (!req.adminContext) {
          return reply.status(403).send({ message: 'Admin profili bulunamadı' });
        }

        const profile = await updateAdminProfile(
          req.adminContext,
          req.auth!.userId,
          req.auth!.userId,
          req.body as AdminProfileUpdateInput
        );

        return reply.status(200).send({
          message: 'Profil güncellendi',
          ...profile,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Admin profil işlemi sırasında bir hata oluştu');
      }
    }
  );

  fastify.patch(
    '/:userId',
    {
      preHandler: [
        requireAuth,
        requireAdmin,
        validateParams(userIdParamSchema),
        validateBody(adminProfileUpdateSchema),
      ],
    },
    async (req, reply) => {
      try {
        if (!req.adminContext) {
          return reply.status(403).send({ message: 'Admin profili bulunamadı' });
        }

        const { userId } = req.params as { userId: string };
        const profile = await updateAdminProfile(
          req.adminContext,
          req.auth!.userId,
          userId,
          req.body as AdminProfileUpdateInput
        );

        return reply.status(200).send({
          message: 'Admin profili güncellendi',
          ...profile,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Admin profil işlemi sırasında bir hata oluştu');
      }
    }
  );
}
