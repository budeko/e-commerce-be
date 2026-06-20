import type { ClientSession } from 'mongoose';
import { Order } from '@/integrations/mongo';
import { CommerceError } from '@/internal/common/errors/commerce-error';

type CreateOrderData = {
  _id: string;
  buyerId: string;
  items: unknown[];
  totalAmount: number;
  currency: string;
  status: string;
  shippingAddress: unknown;
};

export const findBuyerOrder = async (buyerId: string, orderId: string) => {
  const order = await Order.findOne({ _id: orderId, buyerId }).lean();

  if (!order) {
    throw new CommerceError(404, 'Sipariş bulunamadı');
  }

  return order;
};

export const findSellerOrderLean = async (sellerId: string, orderId: string) => {
  const order = await Order.findOne({
    _id: orderId,
    'items.sellerId': sellerId,
  }).lean();

  if (!order) {
    throw new CommerceError(404, 'Sipariş bulunamadı');
  }

  return order;
};

export const findSellerOrderForUpdate = async (sellerId: string, orderId: string) =>
  Order.findOne({
    _id: orderId,
    'items.sellerId': sellerId,
  });

export const findOrderByIdLean = async (orderId: string) => Order.findById(orderId).lean();

export const listBuyerOrdersLean = async (buyerId: string) =>
  Order.find({ buyerId }).sort({ createdAt: -1 }).lean();

export const listSellerOrdersLean = async (sellerId: string) =>
  Order.find({ 'items.sellerId': sellerId }).sort({ createdAt: -1 }).lean();

export const createOrderInSession = async (data: CreateOrderData, session: ClientSession) => {
  const [order] = await Order.create([data], { session });
  return order;
};

export const saveOrderDocument = async (order: {
  updatedAt?: Date;
  save: () => Promise<unknown>;
}) => {
  order.updatedAt = new Date();
  await order.save();
};
