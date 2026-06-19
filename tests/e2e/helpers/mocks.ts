import { vi } from 'vitest';

vi.mock('@/features/auth/core/mail/send-verification', () => ({
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
  completeIyzicoCheckout: vi.fn().mockResolvedValue({
    status: 'completed',
    externalId: 'e2e-payment-id',
    orderId: 'placeholder-order-id',
    itemTransactions: [{ itemId: 'prod-1', paymentTransactionId: 'txn-1' }],
  }),
}));
