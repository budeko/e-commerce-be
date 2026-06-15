import Iyzipay from 'iyzipay';
import { getIyzicoClient } from '@/lib/integrations/iyzico/client';
import { promisifyIyzipay } from '@/lib/integrations/iyzico/promisify';
import { EcommerceError } from '@/lib/ecommerce/errors';

export const approveIyzicoPaymentItem = async (
  paymentTransactionId: string,
  conversationId: string
): Promise<void> => {
  const client = getIyzicoClient();

  const result = await promisifyIyzipay(
    client.approval.create!.bind(client.approval),
    {
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      paymentTransactionId,
    }
  );

  if (result.status !== 'success') {
    throw new EcommerceError(
      502,
      result.errorMessage ?? 'Iyzico ödeme onayı gönderilemedi'
    );
  }
};
