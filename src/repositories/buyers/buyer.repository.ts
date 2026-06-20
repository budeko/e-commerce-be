import { Buyer, User } from '@/integrations/mongo';

export const findBuyerShippingProfileLean = async (buyerId: string) =>
  Buyer.findById(buyerId).lean();

export const findBuyerPaymentProfileLean = async (buyerId: string) => {
  const [user, buyer] = await Promise.all([
    User.findById(buyerId).lean(),
    Buyer.findById(buyerId).lean(),
  ]);

  return { user, buyer };
};
