const parseCommissionRate = (raw: string | undefined, fallback: number): number => {
  if (!raw?.trim()) {
    return fallback;
  }

  const rate = Number(raw);

  if (!Number.isFinite(rate) || rate < 0 || rate >= 1) {
    throw new Error('PLATFORM_COMMISSION_RATE 0 ile 1 arasında olmalı (örn. 0.10 = %10)');
  }

  return rate;
};

export const getPlatformCommissionRate = (): number => {
  const raw = process.env.PLATFORM_COMMISSION_RATE?.trim();

  if (!raw) {
    throw new Error('PLATFORM_COMMISSION_RATE tanımlı olmalı (örn. 0.10 = %10 komisyon)');
  }

  return parseCommissionRate(raw, 0.1);
};

export type ItemSplitAmounts = {
  subtotal: number;
  commissionAmount: number;
  sellerShare: number;
};

export const calcItemSplit = (
  subtotal: number,
  rate: number = getPlatformCommissionRate()
): ItemSplitAmounts => {
  const commissionAmount = Math.round(subtotal * rate * 100) / 100;
  const sellerShare = Math.round((subtotal - commissionAmount) * 100) / 100;

  return {
    subtotal,
    commissionAmount,
    sellerShare,
  };
};
