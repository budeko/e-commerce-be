import Iyzipay from 'iyzipay';
import { getIyzicoClient } from '@/lib/integrations/iyzico/client';
import { promisifyIyzipay } from '@/lib/integrations/iyzico/promisify';
import type { CompleteCheckoutResult } from '@/lib/integrations/iyzico/types';
import { EcommerceError } from '@/lib/ecommerce/errors';

export const completeIyzicoCheckout = async (token: string): Promise<CompleteCheckoutResult> => {
  const client = getIyzicoClient();

  const result = await promisifyIyzipay(client.checkoutForm.retrieve.bind(client.checkoutForm), {
    locale: Iyzipay.LOCALE.TR,
    token,
  });

  if (result.status !== 'success') {
    throw new EcommerceError(502, result.errorMessage ?? 'Iyzico ödeme doğrulanamadı');
  }

  const orderId = result.basketId ?? result.conversationId;

  if (!orderId) {
    throw new EcommerceError(502, 'Iyzico yanıtında sipariş bilgisi bulunamadı');
  }

  if (result.paymentStatus !== 'SUCCESS') {
    return {
      status: 'failed',
      orderId,
      reason: result.errorMessage ?? 'Ödeme başarısız',
    };
  }

  if (!result.paymentId) {
    throw new EcommerceError(502, 'Iyzico yanıtında ödeme kimliği bulunamadı');
  }

  return {
    status: 'completed',
    externalId: String(result.paymentId),
    orderId,
  };
};
