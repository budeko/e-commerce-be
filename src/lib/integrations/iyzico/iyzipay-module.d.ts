declare module 'iyzipay' {
  type IyzipayCallback<T> = (err: unknown, result: T) => void;

  type IyzipayClient = {
    checkoutFormInitialize: {
      create: (request: Record<string, unknown>, callback: IyzipayCallback<IyzipayApiResult>) => void;
    };
    checkoutForm: {
      retrieve: (request: Record<string, unknown>, callback: IyzipayCallback<IyzipayRetrieveResult>) => void;
    };
  };

  type IyzipayApiResult = {
    status: string;
    errorCode?: string;
    errorMessage?: string;
    token?: string;
    paymentPageUrl?: string;
    checkoutFormContent?: string;
  };

  type IyzipayRetrieveResult = {
    status: string;
    errorCode?: string;
    errorMessage?: string;
    paymentStatus?: string;
    paymentId?: string;
    basketId?: string;
    conversationId?: string;
    paidPrice?: string;
  };

  type IyzipayConfig = {
    apiKey: string;
    secretKey: string;
    uri: string;
  };

  const Iyzipay: {
    new (config: IyzipayConfig): IyzipayClient;
    LOCALE: { TR: string; EN: string };
    CURRENCY: { TRY: string };
    PAYMENT_GROUP: { PRODUCT: string };
    BASKET_ITEM_TYPE: { PHYSICAL: string; VIRTUAL: string };
  };

  export = Iyzipay;
}
