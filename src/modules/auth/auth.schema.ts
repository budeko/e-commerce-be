import type { FastifySchema } from "fastify";

const emailPattern = {
  type: "string" as const,
  format: "email" as const,
};

const passwordPattern = {
  type: "string" as const,
  minLength: 8,
  maxLength: 128,
};

export const registerSchema: FastifySchema = {
  body: {
    type: "object",
    required: [
      "email",
      "password",
      "phone",
      "selectedRole",
      "legalType",
      "businessType",
    ],
    additionalProperties: false,
    properties: {
      email: emailPattern,
      password: passwordPattern,
      phone: { type: "string", minLength: 10, maxLength: 20 },
      selectedRole: { type: "string", enum: ["BUYER", "SELLER"] },
      legalType: { type: "string", enum: ["INDIVIDUAL", "CORPORATE"] },
      businessType: { type: "string" },
      storeName: { type: "string", minLength: 2, maxLength: 255 },
      taxNumber: { type: "string", maxLength: 50 },
      taxOffice: { type: "string", maxLength: 100 },
      iban: { type: "string", maxLength: 34 },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        message: { type: "string" },
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            phone: { type: "string", nullable: true },
            status: { type: "string" },
          },
        },
        profile: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["BUYER", "SELLER"] },
            id: { type: "string" },
          },
        },
      },
    },
  },
};

export const loginSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      email: emailPattern,
      password: { type: "string", minLength: 1 },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        token: { type: "string" },
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            status: { type: "string" },
          },
        },
        activeProfile: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["BUYER", "SELLER"] },
            profileId: { type: "string" },
          },
        },
        subRole: { type: "string" },
      },
    },
  },
};

export const meSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            phone: { type: "string", nullable: true },
            status: { type: "string" },
          },
        },
        activeProfile: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["BUYER", "SELLER"] },
            profileId: { type: "string" },
          },
        },
        subRole: { type: "string" },
        profile: { type: "object", additionalProperties: true },
      },
    },
  },
};

export type SelectedRole = "BUYER" | "SELLER";
export type LegalType = "INDIVIDUAL" | "CORPORATE";

export type BuyerBusinessType =
  | "STANDARD"
  | "WHOLESALE_BUYER"
  | "DISTRIBUTOR_RESELLER";

export type SellerBusinessType = "RETAIL" | "WHOLESALE" | "MANUFACTURER";

export interface RegisterBody {
  email: string;
  password: string;
  phone: string;
  selectedRole: SelectedRole;
  legalType: LegalType;
  businessType: string;
  storeName?: string;
  taxNumber?: string;
  taxOffice?: string;
  iban?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

const BUYER_BUSINESS_TYPES: BuyerBusinessType[] = [
  "STANDARD",
  "WHOLESALE_BUYER",
  "DISTRIBUTOR_RESELLER",
];

const SELLER_BUSINESS_TYPES: SellerBusinessType[] = [
  "RETAIL",
  "WHOLESALE",
  "MANUFACTURER",
];

export function validateRegisterBusinessRules(
  body: RegisterBody,
): string | null {
  if (body.selectedRole === "BUYER") {
    if (!BUYER_BUSINESS_TYPES.includes(body.businessType as BuyerBusinessType)) {
      return `Invalid businessType for BUYER. Allowed: ${BUYER_BUSINESS_TYPES.join(", ")}`;
    }
    return null;
  }

  if (!SELLER_BUSINESS_TYPES.includes(body.businessType as SellerBusinessType)) {
    return `Invalid businessType for SELLER. Allowed: ${SELLER_BUSINESS_TYPES.join(", ")}`;
  }

  if (!body.storeName?.trim()) {
    return "storeName is required when selectedRole is SELLER";
  }

  return null;
}
