import { FastifyReply, FastifyRequest } from 'fastify';
import { User } from '@/db';

export const requireActiveBuyer = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.auth) {
    return reply.status(401).send({ message: 'Giriş gerekli' });
  }

  if (request.auth.role !== 'buyer') {
    return reply.status(403).send({ message: 'Bu işlem için alıcı hesabı gerekli' });
  }

  const user = await User.findById(request.auth.userId).select('isActive role');

  if (!user) {
    return reply.status(401).send({ message: 'Giriş gerekli' });
  }

  if (!user.isActive) {
    return reply.status(403).send({
      message: 'Profilini tamamlamadan alışveriş yapamazsın',
    });
  }
};
