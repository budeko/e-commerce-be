import { FastifyInstance, FastifyReply } from 'fastify';
import { requireAuth } from '../../../../lib/auth/guard/require-auth';
import { requireEmailVerified } from '../../../../lib/auth/guard/require-email-verified';
import { AuthError } from '../../shared/errors';
import { uploadSellerDocument } from './services/documents.service';

const handleError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: 'Belge yüklenirken bir hata oluştu' });
};

export default async function documentsRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/',
    { preHandler: [requireAuth, requireEmailVerified] },
    async (req, reply) => {
      try {
        const file = await req.file();

        if (!file) {
          return reply.status(400).send({ message: 'Dosya zorunlu' });
        }

        const docTypeField = file.fields.docType;

        if (!docTypeField || Array.isArray(docTypeField) || docTypeField.type !== 'field') {
          return reply.status(400).send({ message: 'docType zorunlu' });
        }

        const docType = String(docTypeField.value);
        const buffer = await file.toBuffer();

        const result = await uploadSellerDocument(req.auth!, {
          docType,
          mimeType: file.mimetype,
          buffer,
        });

        return reply.status(200).send({
          message: 'Belge yüklendi',
          ...result,
        });
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );
}
