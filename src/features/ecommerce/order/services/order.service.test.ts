import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCartFindById = vi.fn();
const mockBuyerFindById = vi.fn();
const mockProductFindOne = vi.fn();
const mockProductFindOneAndUpdate = vi.fn();
const mockProductFindByIdAndUpdate = vi.fn();
const mockOrderCreate = vi.fn();
const mockOrderFindOne = vi.fn();
const mockClearCart = vi.fn();

vi.mock('@/features/ecommerce/cart/services/cart.service', () => ({
  clearCart: (...args: unknown[]) => mockClearCart(...args),
}));

vi.mock('@/db', () => ({
  Cart: {
    findById: (...args: unknown[]) => mockCartFindById(...args),
  },
  Buyer: {
    findById: (...args: unknown[]) => mockBuyerFindById(...args),
  },
  Product: {
    findOne: (...args: unknown[]) => mockProductFindOne(...args),
    findOneAndUpdate: (...args: unknown[]) => mockProductFindOneAndUpdate(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockProductFindByIdAndUpdate(...args),
  },
  Order: {
    create: (...args: unknown[]) => mockOrderCreate(...args),
    findOne: (...args: unknown[]) => mockOrderFindOne(...args),
    find: vi.fn(),
  },
}));

vi.mock('@/lib/common/user-id', () => ({
  createUserId: () => '8c9e6679-7425-40de-944b-e07fc1f90ae8',
}));

import {
  createOrderFromCart,
  updateOrderStatus,
} from '@/features/ecommerce/order/services/order.service';

const buyerId = '550e8400-e29b-41d4-a716-446655440000';
const sellerId = '660e8400-e29b-41d4-a716-446655440001';
const productId = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const orderId = '8c9e6679-7425-40de-944b-e07fc1f90ae8';

const buyerProfile = {
  firstName: 'Ali',
  lastName: 'Veli',
  phone: '+905551112233',
  country: 'Türkiye',
  city: 'İstanbul',
  deliveryAddress: 'Kadıköy Mah. No:1',
};

const productDoc = {
  _id: productId,
  sellerId,
  name: 'Kulaklık',
  price: 999,
  stock: 5,
  isActive: true,
};

describe('createOrderFromCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuyerFindById.mockReturnValue({
      lean: vi.fn().mockResolvedValue(buyerProfile),
    });
    mockClearCart.mockResolvedValue({ id: buyerId, items: [] });
  });

  it('sepet boşsa 400 fırlatır', async () => {
    mockCartFindById.mockResolvedValue({ items: [] });

    await expect(createOrderFromCart(buyerId)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Sepet boş',
    });
  });

  it('profil eksikse 400 fırlatır', async () => {
    mockCartFindById.mockResolvedValue({
      items: [{ productId, quantity: 1 }],
    });
    mockBuyerFindById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ firstName: 'Ali' }),
    });

    await expect(createOrderFromCart(buyerId)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Sipariş için teslimat profili eksik',
    });
  });

  it('sepetten sipariş oluşturur', async () => {
    mockCartFindById.mockResolvedValue({
      items: [{ productId, quantity: 2 }],
    });
    mockProductFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(productDoc),
    });
    mockProductFindOneAndUpdate.mockResolvedValue(productDoc);
    mockOrderCreate.mockResolvedValue({
      toObject: () => ({
        _id: orderId,
        buyerId,
        items: [
          {
            productId,
            sellerId,
            name: 'Kulaklık',
            price: 999,
            quantity: 2,
            subtotal: 1998,
          },
        ],
        totalAmount: 1998,
        currency: 'TRY',
        status: 'pending',
        shippingAddress: {
          firstName: 'Ali',
          lastName: 'Veli',
          phone: '+905551112233',
          country: 'Türkiye',
          city: 'İstanbul',
          address: 'Kadıköy Mah. No:1',
        },
      }),
    });

    const result = await createOrderFromCart(buyerId);

    expect(mockOrderCreate).toHaveBeenCalled();
    expect(mockClearCart).toHaveBeenCalledWith(buyerId);
    expect(result.totalAmount).toBe(1998);
    expect(result.status).toBe('pending');
  });
});

describe('updateOrderStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pending siparişi shipped yapar', async () => {
    mockOrderFindOne.mockResolvedValue({
      _id: orderId,
      status: 'pending',
      items: [{ sellerId }],
      save: vi.fn().mockResolvedValue(undefined),
      toObject: () => ({
        _id: orderId,
        buyerId,
        items: [{ sellerId }],
        totalAmount: 1998,
        currency: 'TRY',
        status: 'shipped',
        shippingAddress: buyerProfile,
      }),
    });

    const result = await updateOrderStatus(sellerId, orderId, { status: 'shipped' });

    expect(result.status).toBe('shipped');
  });

  it('geçersiz geçişte 400 fırlatır', async () => {
    mockOrderFindOne.mockResolvedValue({
      _id: orderId,
      status: 'pending',
      items: [{ sellerId }],
    });

    await expect(
      updateOrderStatus(sellerId, orderId, { status: 'delivered' })
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
