import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCategoryFind = vi.fn();
const mockCategoryFindById = vi.fn();
const mockCategoryCreate = vi.fn();
const mockCategoryFindByIdAndDelete = vi.fn();
const mockProductCountDocuments = vi.fn();

vi.mock('@/db', () => ({
  Category: {
    find: (...args: unknown[]) => mockCategoryFind(...args),
    findById: (...args: unknown[]) => mockCategoryFindById(...args),
    create: (...args: unknown[]) => mockCategoryCreate(...args),
    findByIdAndDelete: (...args: unknown[]) => mockCategoryFindByIdAndDelete(...args),
  },
  Product: {
    countDocuments: (...args: unknown[]) => mockProductCountDocuments(...args),
  },
}));

vi.mock('@/lib/common/user-id', () => ({
  createUserId: () => '7c9e6679-7425-40de-944b-e07fc1f90ae7',
}));

import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listPublicCategories,
  updateCategory,
} from '@/features/ecommerce/category/services/category.service';

const categoryId = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

const categoryDoc = {
  _id: categoryId,
  name: 'Elektronik',
  slug: 'elektronik',
  isActive: true,
  sortOrder: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('listPublicCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCategoryFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([categoryDoc]),
      }),
    });
  });

  it('sadece public alanları döner', async () => {
    const result = await listPublicCategories();

    expect(mockCategoryFind).toHaveBeenCalledWith({ isActive: true });
    expect(result).toEqual([
      {
        id: categoryId,
        name: 'Elektronik',
        slug: 'elektronik',
        sortOrder: 0,
      },
    ]);
  });
});

describe('getCategoryById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('kategori yoksa 404 fırlatır', async () => {
    mockCategoryFindById.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });

    await expect(getCategoryById(categoryId)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Kategori bulunamadı',
    });
  });
});

describe('createCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCategoryCreate.mockResolvedValue({
      toObject: () => categoryDoc,
    });
  });

  it('slug verilmezse isimden üretir', async () => {
    const result = await createCategory({ name: 'Elektronik' });

    expect(mockCategoryCreate).toHaveBeenCalledWith({
      _id: categoryId,
      name: 'Elektronik',
      slug: 'elektronik',
      sortOrder: 0,
      isActive: true,
    });
    expect(result.slug).toBe('elektronik');
  });
});

describe('updateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('kategori yoksa 404 fırlatır', async () => {
    mockCategoryFindById.mockResolvedValue(null);

    await expect(updateCategory(categoryId, { name: 'Yeni ad' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('kategori günceller', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    mockCategoryFindById.mockResolvedValue({
      ...categoryDoc,
      save,
      toObject: () => ({
        ...categoryDoc,
        name: 'Ev & Yaşam',
        slug: 'ev-yasam',
      }),
    });

    const result = await updateCategory(categoryId, { name: 'Ev & Yaşam' });

    expect(save).toHaveBeenCalled();
    expect(result.name).toBe('Ev & Yaşam');
    expect(result.slug).toBe('ev-yasam');
  });
});

describe('deleteCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCategoryFindById.mockResolvedValue(categoryDoc);
  });

  it('kategoride ürün varsa 409 fırlatır', async () => {
    mockProductCountDocuments.mockResolvedValue(2);

    await expect(deleteCategory(categoryId)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Bu kategoride ürün bulunduğu için silinemez',
    });
  });

  it('ürün yoksa kategoriyi siler', async () => {
    mockProductCountDocuments.mockResolvedValue(0);

    await deleteCategory(categoryId);

    expect(mockCategoryFindByIdAndDelete).toHaveBeenCalledWith(categoryId);
  });
});
