import { Cart } from '@/integrations/mongo';

export const findCartByBuyerId = async (buyerId: string) => Cart.findById(buyerId);

export const ensureCartDocument = async (buyerId: string) => {
  const existing = await findCartByBuyerId(buyerId);

  if (existing) {
    return existing;
  }

  return Cart.create({ _id: buyerId, items: [] });
};

export const saveCartDocumentItems = async (
  cart: { items: unknown[]; updatedAt?: Date; save: () => Promise<unknown> },
  items: unknown[]
) => {
  cart.items = items;
  cart.updatedAt = new Date();
  await cart.save();
};

export const clearBuyerCartItems = async (buyerId: string) => {
  const cart = await ensureCartDocument(buyerId);
  await saveCartDocumentItems(cart, []);
  return cart;
};
