export const USER_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const LEGAL_TYPES = ["INDIVIDUAL", "CORPORATE"] as const;
export type LegalType = (typeof LEGAL_TYPES)[number];

export const BUYER_BUSINESS_TYPES = [
  "STANDARD",
  "WHOLESALE_BUYER",
  "DISTRIBUTOR_RESELLER",
] as const;
export type BuyerBusinessType = (typeof BUYER_BUSINESS_TYPES)[number];

export const SELLER_BUSINESS_TYPES = [
  "RETAIL",
  "WHOLESALE",
  "MANUFACTURER",
] as const;
export type SellerBusinessType = (typeof SELLER_BUSINESS_TYPES)[number];

export const BUYER_SUB_ROLES = ["OWNER", "MANAGER", "PURCHASER"] as const;
export type BuyerSubRole = (typeof BUYER_SUB_ROLES)[number];

export const SELLER_SUB_ROLES = [
  "OWNER",
  "MANAGER",
  "STOCK_KEEPER",
  "FINANCE",
] as const;
export type SellerSubRole = (typeof SELLER_SUB_ROLES)[number];
