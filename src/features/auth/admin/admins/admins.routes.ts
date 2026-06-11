import { FastifyInstance, FastifyReply } from 'fastify';
import { requireAuth } from '../../../../lib/common/middleware/require-auth';
import { requireAdmin } from '../../../../lib/auth/middleware/require-admin';
import { validateBody } from '../../../../lib/common/middleware/validate-body';
import { validateParams } from '../../../../lib/common/middleware/validate-params';
import { userIdParamSchema } from '../../../../lib/common/validation/param-schemas';
import { RegisterError } from '../../register/register.errors';
import { createAdmin, deleteAdmin, getAdminByUserId, listAdmins, updateAdmin } from './admins.service';
import { createAdminSchema, type CreateAdminInput } from './schemas/create-admin.schema';
import { updateAdminSchema, type UpdateAdminInput } from './schemas/update-admin.schema';

const handleAdminManageError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof RegisterError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Admin işlemi sırasında bir hata oluştu' });
};

const adminOnly = { preHandler: [requireAuth, requireAdmin] };
const adminWithUserId = {
  preHandler: [requireAuth, requireAdmin, validateParams(userIdParamSchema)],
};

export default async function (fastify: FastifyInstance) {
  fastify.get('/', adminOnly, async (_req, reply) => {
    try {
      const admins = await listAdmins();
      return reply.status(200).send({ admins });
    } catch (error) {
      return handleAdminManageError(reply, error);
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
      return handleAdminManageError(reply, error);
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
        return handleAdminManageError(reply, error);
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
        return handleAdminManageError(reply, error);
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
        return handleAdminManageError(reply, error);
      }
    }
  );
}
