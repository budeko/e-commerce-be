import { Payment } from '@/integrations/mongo';

export const findOrderIdByCheckoutToken = async (token: string): Promise<string | null> => {
  const payment = await Payment.findOne({ externalId: token }).select('orderId').lean();
  return payment?.orderId ?? null;
};
