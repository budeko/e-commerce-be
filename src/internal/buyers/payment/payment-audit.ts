import type { PaymentStatus } from '@/integrations/mongo';
import { createLogger } from '@/internal/common/logging';

const log = createLogger({ module: 'payment-audit' });

type PaymentTransitionInput = {
  paymentId: string;
  orderId: string;
  from: PaymentStatus;
  to: PaymentStatus;
  reason: string;
  metadata?: Record<string, unknown>;
};

export const logPaymentTransition = (input: PaymentTransitionInput): void => {
  log.info(
    {
      paymentId: input.paymentId,
      orderId: input.orderId,
      from: input.from,
      to: input.to,
      reason: input.reason,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    },
    'Payment status transitioned'
  );
};
