import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { requireAuth } from '../../shared/guard/require-auth';
import { requireEmailVerified } from '../../shared/guard/require-email-verified';
import { handleAuthRouteError } from '../../shared/handle-route-error';
import { getProfile, updateProfile } from './services/profile.service';
import type { BuyerProfileUpdateInput, SellerProfileUpdateInput } from '../../schemas/profile';
import { validateProfileUpdate } from './helpers/validate-profile-update';
import documentsRoutes from './documents.routes';

export default async function (fastify: FastifyInstance) {
  await fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });

  await fastify.register(documentsRoutes, { prefix: '/documents' });

  fastify.get('/', { preHandler: [requireAuth, requireEmailVerified] }, async (req, reply) => {
    try {
      const result = await getProfile(req.auth!);
      return reply.status(200).send(result);
    } catch (error) {
      return handleAuthRouteError(reply, error, 'Profil işlemi sırasında bir hata oluştu');
    }
  });

  fastify.patch(
    '/',
    { preHandler: [requireAuth, requireEmailVerified, validateProfileUpdate] },
    async (req, reply) => {
      try {
        await updateProfile(
          req.auth!,
          req.body as BuyerProfileUpdateInput | SellerProfileUpdateInput
        );

        const profile = await getProfile(req.auth!);

        return reply.status(200).send({
          message: 'Profil güncellendi',
          ...profile,
        });
      } catch (error) {
        return handleAuthRouteError(reply, error, 'Profil işlemi sırasında bir hata oluştu');
      }
    }
  );
}
