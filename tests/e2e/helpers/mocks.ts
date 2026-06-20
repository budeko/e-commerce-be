import { vi } from 'vitest';

export const mockCompleteIyzicoCheckout = vi.fn();

vi.mock('@/internal/auth/mail/send-verification', () => ({
  sendUserVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/integrations/resend/send', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/integrations/iyzico/initialize-checkout', () => ({
  initializeIyzicoCheckout: vi.fn().mockResolvedValue({
    token: 'e2e-checkout-token',
    paymentPageUrl: 'https://sandbox-cpp.iyzipay.com?token=e2e',
    checkoutFormContent: null,
  }),
}));

vi.mock('@/integrations/iyzico/retrieve-checkout', () => ({
  completeIyzicoCheckout: (...args: unknown[]) => mockCompleteIyzicoCheckout(...args),
}));

vi.mock('@/integrations/iyzico/create-submerchant', () => ({
  createIyzicoSubMerchant: vi.fn().mockResolvedValue('e2e-sub-merchant-key'),
}));

vi.mock('@/internal/auth/admin/mail/send-seller-notifications', () => ({
  sendSellerApprovedEmail: vi.fn().mockResolvedValue(undefined),
  sendSellerRejectedEmail: vi.fn().mockResolvedValue(undefined),
}));
