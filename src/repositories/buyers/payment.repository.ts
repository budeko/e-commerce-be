import { Payment } from '@/integrations/mongo';
import { createUserId } from '@/internal/common/ids';

export const findOrderIdByCheckoutToken = async (token: string): Promise<string | null> => {
  const payment = await Payment.findOne({ externalId: token }).select('orderId').lean();
  return payment?.orderId ?? null;
};

export const findPaymentByOrderId = async (orderId: string) => Payment.findOne({ orderId });

export const findPaymentByOrderIdLean = async (orderId: string) =>
  Payment.findOne({ orderId }).lean();

type CreatePaymentData = {
  orderId: string;
  buyerId: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
};

export const createPayment = async (data: CreatePaymentData) =>
  Payment.create({
    _id: createUserId(),
    ...data,
  });

export const savePaymentDocument = async (payment: {
  updatedAt?: Date;
  save: () => Promise<unknown>;
}) => {
  payment.updatedAt = new Date();
  await payment.save();
};

export const failPendingPaymentsByOrderId = async (orderId: string) =>
  Payment.updateMany(
    { orderId, status: 'pending' },
    { $set: { status: 'failed', updatedAt: new Date() } }
  );
