import { FastifyInstance } from 'fastify';
import { requireAuth } from '@/features/auth/core/guard/require-auth';
import { requireAdmin } from '@/features/auth/core/guard/require-admin';
import { validateBody } from '@/lib/common/http/validate-body';
import { validateParams } from '@/lib/common/http/validate-params';
import { userIdParamSchema } from '@/lib/common/validation/param-schemas';
import { handleRouteError } from '@/lib/common/http/handle-route-error';
import { createAdmin, deleteAdmin, getAdminByUserId, listAdmins, updateAdmin } from '@/features/auth/admin/admins/admins.service';
import { createAdminSchema, type CreateAdminInput } from '@/features/auth/admin/admins/create-admin.schema';
import { updateAdminSchema, type UpdateAdminInput } from '@/features/auth/admin/admins/update-admin.schema';

const adminOnly = { preHandler: [requireAuth, requireAdmin] };
const adminWithUserId = {
  preHandler: [requireAuth, requireAdmin, validateParams(userIdParamSchema)],
};

export default async function (fastify: FastifyInstance) {
  fastify.get('/', adminOnly, async (req, reply) => {
    try {
      if (!req.adminRole) {
        return reply.status(403).send({ message: 'Admin profili bulunamadı' });
      }

      const admins = await listAdmins(req.adminRole);
      return reply.status(200).send({ admins });
    } catch (error) {
      return handleRouteError(reply, error, 'Admin işlemi sırasında bir hata oluştu');
    }
  });

  fastify.get('/:userId', adminWithUserId, async (req, reply) => {
    try {
      if (!req.adminRole) {
        return reply.status(403).send({ message: 'Admin profili bulunamadı' });
      }

      const { userId } = req.params as { userId: string };
      const admin = await getAdminByUserId(req.adminRole, req.auth!.userId, userId);

      return reply.status(200).send(admin);
    } catch (error) {
      return handleRouteError(reply, error, 'Admin işlemi sırasında bir hata oluştu');
    }
  });

  fastify.post(
    '/',
    { preHandler: [requireAuth, requireAdmin, validateBody(createAdminSchema)] },
    async (req, reply) => {
      try {
        if (!req.adminRole) {
          return reply.status(403).send({ message: 'Admin profili bulunamadı' });
        }

        const result = await createAdmin(
          req.auth!.userId,
          req.adminRole,
          req.body as CreateAdminInput
        );

        return reply.status(201).send({
          message: 'Admin oluşturuldu',
          ...result,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Admin işlemi sırasında bir hata oluştu');
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
        validateBody(updateAdminSchema),
      ],
    },
    async (req, reply) => {
      try {
        if (!req.adminRole) {
          return reply.status(403).send({ message: 'Admin profili bulunamadı' });
        }

        const { userId } = req.params as { userId: string };
        const result = await updateAdmin(
          req.adminRole,
          req.auth!.userId,
          userId,
          req.body as UpdateAdminInput
        );

        return reply.status(200).send({
          message: 'Admin güncellendi',
          ...result,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Admin işlemi sırasında bir hata oluştu');
      }
    }
  );

  fastify.delete(
    '/:userId',
    {
      preHandler: [requireAuth, requireAdmin, validateParams(userIdParamSchema)],
    },
    async (req, reply) => {
      try {
        if (!req.adminRole) {
          return reply.status(403).send({ message: 'Admin profili bulunamadı' });
        }

        if (req.adminRole !== 'owner') {
          return reply.status(403).send({ message: 'Bu işlem için owner yetkisi gerekli' });
        }

        const { userId } = req.params as { userId: string };
        const result = await deleteAdmin(req.adminRole, userId);

        return reply.status(200).send({
          message: 'Admin silindi',
          ...result,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Admin işlemi sırasında bir hata oluştu');
      }
    }
  );
}
