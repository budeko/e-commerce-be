import { FastifyInstance } from 'fastify';
import { handleRouteError } from '@/lib/common/http/handle-route-error';
import { listPublicCategories } from '@/features/ecommerce/category/category.service';

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_req, reply) => {
    try {
      const categories = await listPublicCategories();
      return reply.status(200).send({ categories });
    } catch (error) {
      return handleRouteError(reply, error, 'Kategoriler alınırken bir hata oluştu');
    }
  });
}
