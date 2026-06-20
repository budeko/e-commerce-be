import { catalogCacheKeys } from '@/internal/common/cache/catalog-keys';
import { memoryCache } from '@/internal/common/cache/memory-cache';

export const invalidateCatalogCache = (): void => {
  memoryCache.deleteByPrefix(catalogCacheKeys.categoriesPrefix());
  memoryCache.deleteByPrefix(catalogCacheKeys.productsPrefix());
};

export const invalidateCatalogProductCache = (): void => {
  memoryCache.deleteByPrefix(catalogCacheKeys.productsPrefix());
};
