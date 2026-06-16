export type ProductRecord = {
  _id: unknown;
  sellerId: string;
  categoryIds: string[];
  primaryCategoryId: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  price: number;
  currency: string;
  stock: number;
  minOrderQuantity: number;
  isActive: boolean;
  images: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export const toPublicProductResponse = (product: ProductRecord) => ({
  id: String(product._id),
  sellerId: product.sellerId,
  categoryIds: product.categoryIds,
  primaryCategoryId: product.primaryCategoryId,
  name: product.name,
  slug: product.slug ?? null,
  description: product.description ?? null,
  price: product.price,
  currency: product.currency,
  stock: product.stock,
  minOrderQuantity: product.minOrderQuantity ?? 1,
  images: product.images,
  createdAt: product.createdAt,
});

export const toSellerProductResponse = (product: ProductRecord) => ({
  ...toPublicProductResponse(product),
  isActive: product.isActive,
  updatedAt: product.updatedAt,
});
