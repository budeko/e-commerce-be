import { FastifyInstance } from 'fastify';
import { requireAuth } from '@/features/auth/core/guard/require-auth';
import { requireEmailVerified } from '@/features/auth/core/guard/require-email-verified';
import {
  requireApprovedSeller,
  requireSellerPermission,
} from '@/lib/ecommerce/guards/require-approved-seller';
import { validateBody } from '@/lib/common/http/validate-body';
import { validateParams } from '@/lib/common/http/validate-params';
import { validateQuery } from '@/lib/common/http/validate-query';
import { productIdParamSchema } from '@/lib/common/validation/param-schemas';
import { handleRouteError } from '@/lib/common/http/handle-route-error';
import { SELLER_PERMISSIONS } from '@/features/auth/seller/access/permission-keys';
import {
  createProductSchema,
  type CreateProductInput,
} from '@/features/ecommerce/product/create-product.schema';
import {
  updateProductSchema,
  type UpdateProductInput,
} from '@/features/ecommerce/product/update-product.schema';
import {
  listProductsQuerySchema,
  type ListProductsQuery,
} from '@/features/ecommerce/product/list-products.schema';
import {
  createProduct,
  deleteProduct,
  getPublicProductById,
  listPublicProducts,
  listSellerProducts,
  updateProduct,
} from '@/features/ecommerce/product/product.service';

const sellerApproved = {
  preHandler: [requireAuth, requireEmailVerified, requireApprovedSeller],
};

const sellerRead = {
  preHandler: [
    ...sellerApproved.preHandler,
    requireSellerPermission(SELLER_PERMISSIONS.PRODUCTS_READ),
  ],
};

const sellerWrite = {
  preHandler: [
    ...sellerApproved.preHandler,
    requireSellerPermission(SELLER_PERMISSIONS.PRODUCTS_WRITE),
  ],
};

const sellerWriteWithProductId = {
  preHandler: [
    ...sellerWrite.preHandler,
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

  fastify.get('/mine', sellerRead, async (req, reply) => {
    try {
      const products = await listSellerProducts(req.sellerContext!.companyId);
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
        const product = await createProduct(
          req.sellerContext!.companyId,
          req.body as CreateProductInput
        );

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
      preHandler: [...sellerWriteWithProductId.preHandler, validateBody(updateProductSchema)],
    },
    async (req, reply) => {
      try {
        const { productId } = req.params as { productId: string };
        const product = await updateProduct(
          req.sellerContext!.companyId,
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

  fastify.delete('/:productId', sellerWriteWithProductId, async (req, reply) => {
    try {
      const { productId } = req.params as { productId: string };
      await deleteProduct(req.sellerContext!.companyId, productId);

      return reply.status(200).send({ message: 'Ürün silindi' });
    } catch (error) {
      return handleRouteError(reply, error, 'Ürün işlemi sırasında bir hata oluştu');
    }
  });
}
