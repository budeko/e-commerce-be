import { Cart, Product } from '@/db';
import { EcommerceError } from '@/features/ecommerce/core/errors';
import type { AddToCartInput } from '@/features/ecommerce/cart/add-to-cart.schema';
import {
  assertCartItemQuantity,
  resolveMinOrderQuantity,
} from '@/features/ecommerce/product/product-order-quantity';

type CartItemRecord = {
  productId: string;
  quantity: number;
  priceSnapshot?: number | null;
};

type ProductSummary = {
  _id: unknown;
  name: string;
  price: number;
  stock: number;
  minOrderQuantity?: number;
  isActive: boolean;
  images: string[];
};

const toCartItemResponse = (
  item: CartItemRecord,
  product?: ProductSummary | null
) => ({
  productId: item.productId,
  quantity: item.quantity,
  priceSnapshot: item.priceSnapshot ?? null,
  product: product
    ? {
        name: product.name,
        price: product.price,
        stock: product.stock,
        minOrderQuantity: resolveMinOrderQuantity(product.minOrderQuantity),
        isActive: product.isActive,
        images: product.images,
      }
    : null,
  isAvailable: Boolean(
    product?.isActive &&
      product.stock >= item.quantity &&
      item.quantity >= resolveMinOrderQuantity(product.minOrderQuantity)
  ),
});

const toCartResponse = (
  cart: { _id: unknown; items: CartItemRecord[]; updatedAt?: Date },
  productsById: Map<string, ProductSummary>
) => ({
  id: String(cart._id),
  items: cart.items.map((item) =>
    toCartItemResponse(item, productsById.get(item.productId) ?? null)
  ),
  updatedAt: cart.updatedAt,
});

const getActiveProduct = async (productId: string) => {
  const product = await Product.findOne({
    _id: productId,
    isActive: true,
    categoryId: { $ne: null },
  }).lean();

  if (!product) {
    throw new EcommerceError(404, 'Ürün bulunamadı');
  }

  return product;
};

const ensureCart = async (buyerId: string) => {
  const existing = await Cart.findById(buyerId);

  if (existing) {
    return existing;
  }

  return Cart.create({ _id: buyerId, items: [] });
};

const loadProductsForItems = async (items: CartItemRecord[]) => {
  const productIds = items.map((item) => item.productId);

  if (productIds.length === 0) {
    return new Map<string, ProductSummary>();
  }

  const products = await Product.find({ _id: { $in: productIds } })
    .select('name price stock minOrderQuantity isActive images')
    .lean();

  return new Map(products.map((product) => [String(product._id), product as ProductSummary]));
};

const saveCartItems = async (
  cart: { items: CartItemRecord[]; updatedAt?: Date; save: () => Promise<unknown> },
  items: CartItemRecord[]
) => {
  cart.items = items;
  cart.updatedAt = new Date();
  await cart.save();
};

export const getCart = async (buyerId: string) => {
  const cart = await ensureCart(buyerId);
  const productsById = await loadProductsForItems(cart.items);

  return toCartResponse(cart.toObject(), productsById);
};

export const addToCart = async (buyerId: string, input: AddToCartInput) => {
  const product = await getActiveProduct(input.productId);
  const cart = await ensureCart(buyerId);

  const items = cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    priceSnapshot: item.priceSnapshot,
  }));

  const existingIndex = items.findIndex((item) => item.productId === input.productId);
  const nextQuantity =
    existingIndex >= 0 ? items[existingIndex].quantity + input.quantity : input.quantity;

  assertCartItemQuantity(nextQuantity, product);

  const nextItem = {
    productId: input.productId,
    quantity: nextQuantity,
    priceSnapshot: product.price,
  };

  if (existingIndex >= 0) {
    items[existingIndex] = nextItem;
  } else {
    items.push(nextItem);
  }

  await saveCartItems(cart, items);

  const productsById = await loadProductsForItems(items);

  return toCartResponse({ ...cart.toObject(), items }, productsById);
};

export const updateCartItem = async (
  buyerId: string,
  productId: string,
  quantity: number
) => {
  const product = await getActiveProduct(productId);
  const cart = await ensureCart(buyerId);

  const items = cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    priceSnapshot: item.priceSnapshot,
  }));

  const existingIndex = items.findIndex((item) => item.productId === productId);

  if (existingIndex < 0) {
    throw new EcommerceError(404, 'Ürün sepette bulunamadı');
  }

  assertCartItemQuantity(quantity, product);

  items[existingIndex] = {
    productId,
    quantity,
    priceSnapshot: product.price,
  };

  await saveCartItems(cart, items);

  const productsById = await loadProductsForItems(items);

  return toCartResponse({ ...cart.toObject(), items }, productsById);
};

export const removeCartItem = async (buyerId: string, productId: string) => {
  const cart = await ensureCart(buyerId);

  const items = cart.items
    .map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      priceSnapshot: item.priceSnapshot,
    }))
    .filter((item) => item.productId !== productId);

  if (items.length === cart.items.length) {
    throw new EcommerceError(404, 'Ürün sepette bulunamadı');
  }

  await saveCartItems(cart, items);

  const productsById = await loadProductsForItems(items);

  return toCartResponse({ ...cart.toObject(), items }, productsById);
};

export const clearCart = async (buyerId: string) => {
  const cart = await ensureCart(buyerId);

  await saveCartItems(cart, []);

  return toCartResponse({ ...cart.toObject(), items: [] }, new Map());
};
