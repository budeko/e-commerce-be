export { connectDB } from '@/db/connection';

export { User } from '@/db/models/auth/user.model';
export { Buyer } from '@/db/models/auth/buyer.model';
export { Seller, SELLER_APPROVAL_STATUSES } from '@/db/models/auth/seller.model';
export type { SellerApprovalStatus } from '@/db/models/auth/seller.model';
export { SellerMember } from '@/db/models/auth/seller-member.model';
export {
  SellerRole,
  SELLER_SYSTEM_OWNER_ROLE_SLUG,
} from '@/db/models/auth/seller-role.model';
export { Admin } from '@/db/models/auth/admin.model';
export { AdminRole, SYSTEM_OWNER_ROLE_SLUG } from '@/db/models/auth/admin-role.model';
export { RevokedToken } from '@/db/models/auth/revoked-token.model';
export { AuthOtp, AUTH_OTP_PURPOSES, buildAuthOtpId } from '@/db/models/auth/auth-otp.model';
export type { AuthOtpPurpose } from '@/db/models/auth/auth-otp.model';
export {
  AuthEmailCooldown,
  AUTH_EMAIL_COOLDOWN_PURPOSES,
  buildAuthEmailCooldownId,
} from '@/db/models/auth/auth-email-cooldown.model';
export type { AuthEmailCooldownPurpose } from '@/db/models/auth/auth-email-cooldown.model';

export { Category } from '@/db/models/ecommerce/category.model';
export {
  Product,
  PRODUCT_CURRENCIES,
} from '@/db/models/ecommerce/product.model';
export type { ProductCurrency } from '@/db/models/ecommerce/product.model';
export { Cart } from '@/db/models/ecommerce/cart.model';
export {
  Order,
  ORDER_STATUSES,
  ORDER_CURRENCIES,
} from '@/db/models/ecommerce/order.model';
export type { OrderStatus, OrderCurrency } from '@/db/models/ecommerce/order.model';
export {
  Payment,
  PAYMENT_STATUSES,
  PAYMENT_CURRENCIES,
} from '@/db/models/ecommerce/payment.model';
export type { PaymentStatus, PaymentCurrency } from '@/db/models/ecommerce/payment.model';
export {
  PaymentSplit,
  PAYMENT_SPLIT_APPROVAL_STATUSES,
} from '@/db/models/ecommerce/payment-split.model';
export type { PaymentSplitApprovalStatus } from '@/db/models/ecommerce/payment-split.model';
