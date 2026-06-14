export type InitializeCheckoutInput = {
  orderId: string;
  buyerId: string;
  amount: number;
  currency: string;
  clientIp: string;
  buyer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    nationalId: string;
    country: string;
    city: string;
    address: string;
    createdAt: Date;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
};

export type InitializeCheckoutResult = {
  token: string;
  paymentPageUrl: string | null;
  checkoutFormContent: string | null;
};

export type CompleteCheckoutResult =
  | {
      status: 'completed';
      externalId: string;
      orderId: string;
    }
  | {
      status: 'failed';
      orderId: string;
      reason: string;
    };
