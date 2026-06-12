import { FastifyReply, FastifyRequest } from 'fastify';
import { sanitizeRequestBody } from '@/lib/common/validation/sanitize';
import { buyerProfileUpdateSchema } from '@/features/auth/schemas/profile/buyer-profile-update.schema';
import { sellerProfileUpdateSchema } from '@/features/auth/schemas/profile/seller-profile-update.schema';

export const validateProfileUpdate = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const role = request.auth?.role;

  if (!role) {
    return reply.status(401).send({ message: 'Giriş gerekli' });
  }

  if (role === 'admin') {
    return reply.status(403).send({ message: 'Admin profili /auth/admin/profile üzerinden yönetilir' });
  }

  const schema = role === 'buyer' ? buyerProfileUpdateSchema : sellerProfileUpdateSchema;
  const parsed = schema.safeParse(sanitizeRequestBody(request.body));

  if (!parsed.success) {
    return reply.status(400).send({
      message: 'Geçersiz istek verisi',
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  request.body = parsed.data;
};
