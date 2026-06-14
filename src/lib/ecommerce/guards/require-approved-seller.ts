import { FastifyReply, FastifyRequest } from 'fastify';
import { Seller } from '@/db';

export const requireApprovedSeller = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.auth) {
    return reply.status(401).send({ message: 'Giriş gerekli' });
  }

  if (request.auth.role !== 'seller') {
    return reply.status(403).send({ message: 'Bu işlem için satıcı hesabı gerekli' });
  }

  const seller = await Seller.findById(request.auth.userId).select('approvalStatus');

  if (!seller) {
    return reply.status(403).send({ message: 'Satıcı profili bulunamadı' });
  }

  if (seller.approvalStatus !== 'approved') {
    return reply.status(403).send({ message: 'Onaylı satıcı hesabı gerekli' });
  }
};
