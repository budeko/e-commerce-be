import { describe, expect, it } from 'vitest';
import { calcItemSplit } from '@/lib/ecommerce/commission';

describe('calcItemSplit', () => {
  it('komisyonu düşerek satıcı payını hesaplar', () => {
    expect(calcItemSplit(1000, 0.1)).toEqual({
      subtotal: 1000,
      commissionAmount: 100,
      sellerShare: 900,
    });
  });

  it('küsuratlı tutarlarda iki haneye yuvarlar', () => {
    expect(calcItemSplit(999.99, 0.1)).toEqual({
      subtotal: 999.99,
      commissionAmount: 100,
      sellerShare: 899.99,
    });
  });
});
