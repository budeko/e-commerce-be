import { Product } from '@/integrations/mongo';

export const findActiveCatalogProductLean = async (productId: string) =>
  Product.findOne({
    _id: productId,
    isActive: true,
    categoryId: { $ne: null },
  }).lean();

export const findActiveProductLean = async (productId: string) =>
  Product.findOne({
    _id: productId,
    isActive: true,
  }).lean();

export const findProductSummariesByIdsLean = async (productIds: string[]) => {
  if (productIds.length === 0) {
    return [];
  }

  return Product.find({ _id: { $in: productIds } })
    .select('name price stock minOrderQuantity isActive images')
    .lean();
};
