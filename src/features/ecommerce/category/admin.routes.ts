import { FastifyInstance } from 'fastify';
import { requireAuth } from '@/features/auth/core/guard/require-auth';
import { requireAdmin } from '@/features/auth/core/guard/require-admin';
import { validateBody } from '@/lib/common/http/validate-body';
import { validateParams } from '@/lib/common/http/validate-params';
import { categoryIdParamSchema } from '@/lib/common/validation/param-schemas';
import { handleRouteError } from '@/lib/common/http/handle-route-error';
import {
  createCategorySchema,
  type CreateCategoryInput,
} from '@/features/ecommerce/category/create-category.schema';
import {
  updateCategorySchema,
  type UpdateCategoryInput,
} from '@/features/ecommerce/category/update-category.schema';
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listAdminCategories,
  updateCategory,
} from '@/features/ecommerce/category/category.service';

const adminOnly = { preHandler: [requireAuth, requireAdmin] };
const adminWithCategoryId = {
  preHandler: [requireAuth, requireAdmin, validateParams(categoryIdParamSchema)],
};

export default async function categoriesAdminRoutes(fastify: FastifyInstance) {
  fastify.get('/', adminOnly, async (_req, reply) => {
    try {
      const categories = await listAdminCategories();
      return reply.status(200).send({ categories });
    } catch (error) {
      return handleRouteError(reply, error, 'Kategori işlemi sırasında bir hata oluştu');
    }
  });

  fastify.get('/:categoryId', adminWithCategoryId, async (req, reply) => {
    try {
      const { categoryId } = req.params as { categoryId: string };
      const category = await getCategoryById(categoryId);
      return reply.status(200).send({ category });
    } catch (error) {
      return handleRouteError(reply, error, 'Kategori işlemi sırasında bir hata oluştu');
    }
  });

  fastify.post(
    '/',
    { preHandler: [...adminOnly.preHandler, validateBody(createCategorySchema)] },
    async (req, reply) => {
      try {
        const category = await createCategory(req.body as CreateCategoryInput);
        return reply.status(201).send({
          message: 'Kategori oluşturuldu',
          category,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Kategori işlemi sırasında bir hata oluştu', {
          duplicateKeyMessage: 'Bu slug zaten kullanılıyor',
        });
      }
    }
  );

  fastify.patch(
    '/:categoryId',
    {
      preHandler: [
        ...adminWithCategoryId.preHandler,
        validateBody(updateCategorySchema),
      ],
    },
    async (req, reply) => {
      try {
        const { categoryId } = req.params as { categoryId: string };
        const category = await updateCategory(categoryId, req.body as UpdateCategoryInput);

        return reply.status(200).send({
          message: 'Kategori güncellendi',
          category,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Kategori işlemi sırasında bir hata oluştu', {
          duplicateKeyMessage: 'Bu slug zaten kullanılıyor',
        });
      }
    }
  );

  fastify.delete('/:categoryId', adminWithCategoryId, async (req, reply) => {
    try {
      const { categoryId } = req.params as { categoryId: string };
      await deleteCategory(categoryId);

      return reply.status(200).send({ message: 'Kategori silindi' });
    } catch (error) {
      return handleRouteError(reply, error, 'Kategori işlemi sırasında bir hata oluştu');
    }
  });
}
