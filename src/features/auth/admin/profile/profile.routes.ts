import { FastifyInstance, FastifyReply } from 'fastify';
import { requireAuth } from '../../../../lib/common/middleware/require-auth';
import { requireAdmin } from '../../../../lib/auth/middleware/require-admin';
import { validateBody } from '../../../../lib/common/middleware/validate-body';
import { validateParams } from '../../../../lib/common/middleware/validate-params';
import { userIdParamSchema } from '../../../../lib/common/validation/param-schemas';
import { RegisterError } from '../../register/register.errors';
import {
  adminProfileUpdateSchema,
  type AdminProfileUpdateInput,
} from '../schemas/admin-profile-fields.schema';
import { getAdminProfile, updateAdminProfile } from './profile.service';

const handleError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof RegisterError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Admin profil işlemi sırasında bir hata oluştu' });
};

const adminOnly = { preHandler: [requireAuth, requireAdmin] };

export default async function (fastify: FastifyInstance) {
  fastify.get('/', adminOnly, async (req, reply) => {
    try {
      if (!req.adminRole) {
        return reply.status(403).send({ message: 'Admin profili bulunamadı' });
      }

      const profile = await getAdminProfile(req.adminRole, req.auth!.userId);
      return reply.status(200).send(profile);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  fastify.patch(
    '/',
    { preHandler: [...adminOnly.preHandler, validateBody(adminProfileUpdateSchema)] },
    async (req, reply) => {
      try {
        if (!req.adminRole) {
          return reply.status(403).send({ message: 'Admin profili bulunamadı' });
        }

        const profile = await updateAdminProfile(
          req.adminRole,
          req.auth!.userId,
          req.auth!.userId,
          req.body as AdminProfileUpdateInput
        );

        return reply.status(200).send({
          message: 'Profil güncellendi',
          ...profile,
        });
      } catch (error) {
        return handleError(reply, error);
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
        if (!req.adminRole) {
          return reply.status(403).send({ message: 'Admin profili bulunamadı' });
        }

        const { userId } = req.params as { userId: string };
        const profile = await updateAdminProfile(
          req.adminRole,
          req.auth!.userId,
          userId,
          req.body as AdminProfileUpdateInput
        );

        return reply.status(200).send({
          message: 'Admin profili güncellendi',
          ...profile,
        });
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );
}
