import { FastifyInstance } from 'fastify';
import { requireAuth } from '@/features/auth/shared/guard/require-auth';
import { requireEmailVerified } from '@/features/auth/shared/guard/require-email-verified';
import { requireApprovedSeller } from '@/lib/ecommerce/guard/require-approved-seller';
import { validateBody } from '@/lib/common/http/validate-body';
import { validateParams } from '@/lib/common/http/validate-params';
import { validateQuery } from '@/lib/common/http/validate-query';
import { productIdParamSchema } from '@/lib/common/validation/param-schemas';
import { handleRouteError } from '@/lib/common/http/handle-route-error';
import {
  createProductSchema,
  type CreateProductInput,
} from '@/features/ecommerce/schemas/product/create-product.schema';
import {
  updateProductSchema,
  type UpdateProductInput,
} from '@/features/ecommerce/schemas/product/update-product.schema';
import {
  listProductsQuerySchema,
  type ListProductsQuery,
} from '@/features/ecommerce/schemas/product/list-products.schema';
import {
  createProduct,
  deleteProduct,
  getPublicProductById,
  listPublicProducts,
  listSellerProducts,
  updateProduct,
} from '@/features/ecommerce/product/services/product.service';

const sellerWrite = {
  preHandler: [requireAuth, requireEmailVerified, requireApprovedSeller],
};

const sellerWithProductId = {
  preHandler: [
    requireAuth,
    requireEmailVerified,
    requireApprovedSeller,
    validateParams(productIdParamSchema),
  ],
};

export default async function productRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    { preHandler: [validateQuery(listProductsQuerySchema)] },
    async (req, reply) => {
      try {
        const result = await listPublicProducts(req.query as ListProductsQuery);
        return reply.status(200).send(result);
      } catch (error) {
        return handleRouteError(reply, error, 'Ürünler alınırken bir hata oluştu');
      }
    }
  );

  fastify.get('/mine', sellerWrite, async (req, reply) => {
    try {
      const products = await listSellerProducts(req.auth!.userId);
      return reply.status(200).send({ products });
    } catch (error) {
      return handleRouteError(reply, error, 'Ürün işlemi sırasında bir hata oluştu');
    }
  });

  fastify.get(
    '/:productId',
    { preHandler: [validateParams(productIdParamSchema)] },
    async (req, reply) => {
      try {
        const { productId } = req.params as { productId: string };
        const product = await getPublicProductById(productId);
        return reply.status(200).send({ product });
      } catch (error) {
        return handleRouteError(reply, error, 'Ürün alınırken bir hata oluştu');
      }
    }
  );

  fastify.post(
    '/',
    { preHandler: [...sellerWrite.preHandler, validateBody(createProductSchema)] },
    async (req, reply) => {
      try {
        const product = await createProduct(req.auth!.userId, req.body as CreateProductInput);

        return reply.status(201).send({
          message: 'Ürün oluşturuldu',
          product,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Ürün işlemi sırasında bir hata oluştu', {
          duplicateKeyMessage: 'Bu slug zaten kullanılıyor',
        });
      }
    }
  );

  fastify.patch(
    '/:productId',
    {
      preHandler: [...sellerWithProductId.preHandler, validateBody(updateProductSchema)],
    },
    async (req, reply) => {
      try {
        const { productId } = req.params as { productId: string };
        const product = await updateProduct(
          req.auth!.userId,
          productId,
          req.body as UpdateProductInput
        );

        return reply.status(200).send({
          message: 'Ürün güncellendi',
          product,
        });
      } catch (error) {
        return handleRouteError(reply, error, 'Ürün işlemi sırasında bir hata oluştu', {
          duplicateKeyMessage: 'Bu slug zaten kullanılıyor',
        });
      }
    }
  );

  fastify.delete('/:productId', sellerWithProductId, async (req, reply) => {
    try {
      const { productId } = req.params as { productId: string };
      await deleteProduct(req.auth!.userId, productId);

      return reply.status(200).send({ message: 'Ürün silindi' });
    } catch (error) {
      return handleRouteError(reply, error, 'Ürün işlemi sırasında bir hata oluştu');
    }
  });
}
