import { catalogCacheKeys } from '@/internal/cache/catalog-keys';
import { memoryCache } from '@/internal/cache/memory-cache';

export const invalidateCatalogCache = (): void => {
  memoryCache.deleteByPrefix(catalogCacheKeys.categoriesPrefix());
  memoryCache.deleteByPrefix(catalogCacheKeys.productsPrefix());
};

export const invalidateCatalogProductCache = (): void => {
  memoryCache.deleteByPrefix(catalogCacheKeys.productsPrefix());
};
