import { Order } from '@/integrations/mongo';
import { CommerceError } from '@/internal/common/errors/commerce-error';

export const findBuyerOrder = async (buyerId: string, orderId: string) => {
  const order = await Order.findOne({ _id: orderId, buyerId }).lean();

  if (!order) {
    throw new CommerceError(404, 'Sipariş bulunamadı');
  }

  return order;
};
