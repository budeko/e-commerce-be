import { describe, expect, it } from 'vitest';
import { assertCartItemQuantity } from '@/features/ecommerce/product/product-order-quantity';

describe('assertCartItemQuantity', () => {
  it('minimum adedin altında 400 fırlatır', () => {
    expect(() =>
      assertCartItemQuantity(2, { stock: 10, minOrderQuantity: 5 })
    ).toThrowError(
      expect.objectContaining({
        statusCode: 400,
        message: 'Minimum sipariş adedi 5',
      })
    );
  });

  it('stok yetersizse 400 fırlatır', () => {
    expect(() =>
      assertCartItemQuantity(6, { stock: 5, minOrderQuantity: 1 })
    ).toThrowError(
      expect.objectContaining({
        statusCode: 400,
        message: 'Yetersiz stok',
      })
    );
  });

  it('geçerli adette hata fırlatmaz', () => {
    expect(() =>
      assertCartItemQuantity(5, { stock: 10, minOrderQuantity: 5 })
    ).not.toThrow();
  });
});
