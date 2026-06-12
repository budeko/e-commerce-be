import { FastifyInstance, FastifyReply } from 'fastify';
import multipart from '@fastify/multipart';
import { requireAuth } from '../../../../lib/auth/guard/require-auth';
import { requireEmailVerified } from '../../../../lib/auth/guard/require-email-verified';
import { AuthError } from '../../shared/errors';
import { getProfile, updateProfile } from './services/profile.service';
import type { BuyerProfileUpdateInput, SellerProfileUpdateInput } from '../../schemas/profile';
import { validateProfileUpdate } from './helpers/validate-profile-update';
import documentsRoutes from './documents.routes';

const handleProfileError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Profil işlemi sırasında bir hata oluştu' });
};

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
      return handleProfileError(reply, error);
    }
  });

  fastify.patch(
    '/',
    { preHandler: [requireAuth, requireEmailVerified, validateProfileUpdate] },
    async (req, reply) => {
      try {
        const result = await updateProfile(
          req.auth!,
          req.body as BuyerProfileUpdateInput | SellerProfileUpdateInput
        );

        if (req.auth!.role === 'seller') {
          const sellerResult = result as Awaited<
            ReturnType<typeof updateProfile>
          > & { approvalStatus: string };

          return reply.status(200).send({
            message: 'Profil güncellendi',
            approvalStatus: sellerResult.approvalStatus,
            profile: sellerResult.profile,
          });
        }

        const buyerResult = result as { profile: unknown; isActive: boolean };

        return reply.status(200).send({
          message: 'Profil güncellendi',
          isActive: buyerResult.isActive,
          profile: buyerResult.profile,
        });
      } catch (error) {
        return handleProfileError(reply, error);
      }
    }
  );
}
