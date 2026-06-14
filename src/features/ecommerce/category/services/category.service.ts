import { Category, Product } from '@/db';
import { createUserId } from '@/lib/common/user-id';
import { EcommerceError } from '@/features/ecommerce/shared/errors';
import { slugify } from '@/features/ecommerce/category/helpers/slugify';
import type { CreateCategoryInput } from '@/features/ecommerce/schemas/category/create-category.schema';
import type { UpdateCategoryInput } from '@/features/ecommerce/schemas/category/update-category.schema';

type CategoryRecord = {
  _id: unknown;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
};

const toCategoryResponse = (category: CategoryRecord) => ({
  id: String(category._id),
  name: category.name,
  slug: category.slug,
  isActive: category.isActive,
  sortOrder: category.sortOrder,
  createdAt: category.createdAt,
});

const toPublicCategoryResponse = (category: CategoryRecord) => ({
  id: String(category._id),
  name: category.name,
  slug: category.slug,
  sortOrder: category.sortOrder,
});

const resolveSlug = (name: string, slug?: string) => {
  const resolved = slug ?? slugify(name);

  if (!resolved) {
    throw new EcommerceError(400, 'Geçerli bir slug üretilemedi');
  }

  return resolved;
};

export const listPublicCategories = async () => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return categories.map(toPublicCategoryResponse);
};

export const listAdminCategories = async () => {
  const categories = await Category.find()
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return categories.map(toCategoryResponse);
};

export const getCategoryById = async (categoryId: string) => {
  const category = await Category.findById(categoryId).lean();

  if (!category) {
    throw new EcommerceError(404, 'Kategori bulunamadı');
  }

  return toCategoryResponse(category);
};

export const createCategory = async (input: CreateCategoryInput) => {
  const slug = resolveSlug(input.name, input.slug);

  const category = await Category.create({
    _id: createUserId(),
    name: input.name,
    slug,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
  });

  return toCategoryResponse(category.toObject());
};

export const updateCategory = async (categoryId: string, input: UpdateCategoryInput) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new EcommerceError(404, 'Kategori bulunamadı');
  }

  if (input.name !== undefined) {
    category.name = input.name;
  }

  if (input.slug !== undefined) {
    category.slug = input.slug;
  } else if (input.name !== undefined) {
    category.slug = resolveSlug(input.name);
  }

  if (input.sortOrder !== undefined) {
    category.sortOrder = input.sortOrder;
  }

  if (input.isActive !== undefined) {
    category.isActive = input.isActive;
  }

  await category.save();

  return toCategoryResponse(category.toObject());
};

export const deleteCategory = async (categoryId: string) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw new EcommerceError(404, 'Kategori bulunamadı');
  }

  const productCount = await Product.countDocuments({ categoryId });

  if (productCount > 0) {
    throw new EcommerceError(409, 'Bu kategoride ürün bulunduğu için silinemez');
  }

  await Category.findByIdAndDelete(categoryId);
};
