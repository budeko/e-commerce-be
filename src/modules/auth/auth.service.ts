import mongoose from "mongoose";
import {
  Buyer,
  BuyerMember,
  Seller,
  SellerMember,
  User,
} from "../../models/index.js";
import type { JwtPayload, ProfileType, SubRole } from "../../utils/jwt.js";
import { signToken } from "../../utils/jwt.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import type { RegisterBody } from "./auth.schema.js";

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface RegisterResult {
  user: {
    id: string;
    email: string;
    phone: string | null;
    status: string;
  };
  profile: {
    type: ProfileType;
    id: string;
  };
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    email: string;
    status: string;
  };
  activeProfile: JwtPayload["activeProfile"];
  subRole: SubRole;
}

export interface MeResult {
  user: {
    id: string;
    email: string;
    phone: string | null;
    status: string;
  };
  activeProfile: JwtPayload["activeProfile"];
  subRole: SubRole;
  profile: Record<string, unknown>;
}

function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

export class AuthService {
  async register(body: RegisterBody): Promise<RegisterResult> {
    const existingUser = await User.findOne({
      email: body.email.toLowerCase(),
    });

    if (existingUser) {
      throw new AuthError("Email is already registered", 409);
    }

    const passwordHash = await hashPassword(body.password);
    const session = await mongoose.startSession();

    try {
      let result: RegisterResult | undefined;

      await session.withTransaction(async () => {
        const [user] = await User.create(
          [
            {
              email: body.email.toLowerCase(),
              passwordHash,
              phone: body.phone,
              status: "PENDING",
            },
          ],
          { session },
        );

        if (body.selectedRole === "BUYER") {
          const [buyer] = await Buyer.create(
            [
              {
                legalType: body.legalType,
                businessType: body.businessType,
                taxNumber: body.taxNumber,
                taxOffice: body.taxOffice,
                ownerUserId: user._id,
              },
            ],
            { session },
          );

          await BuyerMember.create(
            [
              {
                userId: user._id,
                buyerId: buyer._id,
                subRole: "OWNER",
              },
            ],
            { session },
          );

          result = {
            user: {
              id: user._id.toString(),
              email: user.email,
              phone: user.phone ?? null,
              status: user.status,
            },
            profile: {
              type: "BUYER",
              id: buyer._id.toString(),
            },
          };
          return;
        }

        const [seller] = await Seller.create(
          [
            {
              storeName: body.storeName!.trim(),
              legalType: body.legalType,
              businessType: body.businessType,
              taxNumber: body.taxNumber,
              taxOffice: body.taxOffice,
              iban: body.iban,
              ownerUserId: user._id,
            },
          ],
          { session },
        );

        await SellerMember.create(
          [
            {
              userId: user._id,
              sellerId: seller._id,
              subRole: "OWNER",
            },
          ],
          { session },
        );

        result = {
          user: {
            id: user._id.toString(),
            email: user.email,
            phone: user.phone ?? null,
            status: user.status,
          },
          profile: {
            type: "SELLER",
            id: seller._id.toString(),
          },
        };
      });

      if (!result) {
        throw new Error("Registration transaction completed without result");
      }

      return result;
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw new AuthError("Email is already registered", 409);
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new AuthError("Invalid email or password", 401);
    }

    if (user.status === "SUSPENDED") {
      throw new AuthError("Account is suspended", 403);
    }

    const passwordValid = await comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      throw new AuthError("Invalid email or password", 401);
    }

    const buyerMember = await BuyerMember.findOne({ userId: user._id })
      .sort({ createdAt: 1 })
      .exec();

    const sellerMember = await SellerMember.findOne({ userId: user._id })
      .sort({ createdAt: 1 })
      .exec();

    if (!buyerMember && !sellerMember) {
      throw new AuthError("No active profile found for this user", 403);
    }

    const useBuyer = buyerMember !== null;
    const activeProfile: JwtPayload["activeProfile"] = useBuyer
      ? { type: "BUYER", profileId: buyerMember!.buyerId.toString() }
      : { type: "SELLER", profileId: sellerMember!.sellerId.toString() };

    const subRole: SubRole = useBuyer
      ? (buyerMember!.subRole as SubRole)
      : (sellerMember!.subRole as SubRole);

    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      activeProfile,
      subRole,
    };

    const token = signToken(payload);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        status: user.status,
      },
      activeProfile,
      subRole,
    };
  }

  async getMe(payload: JwtPayload): Promise<MeResult> {
    const user = await User.findById(payload.userId);

    if (!user) {
      throw new AuthError("User not found", 404);
    }

    if (user.status === "SUSPENDED") {
      throw new AuthError("Account is suspended", 403);
    }

    if (payload.activeProfile.type === "BUYER") {
      const buyerMember = await BuyerMember.findOne({
        userId: payload.userId,
        buyerId: payload.activeProfile.profileId,
      }).populate<{ buyerId: InstanceType<typeof Buyer> }>("buyerId");

      if (!buyerMember || !buyerMember.buyerId) {
        throw new AuthError("Buyer profile not found", 404);
      }

      const buyer = buyerMember.buyerId;

      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          phone: user.phone ?? null,
          status: user.status,
        },
        activeProfile: payload.activeProfile,
        subRole: buyerMember.subRole as SubRole,
        profile: {
          id: buyer._id.toString(),
          legalType: buyer.legalType,
          businessType: buyer.businessType,
          taxNumber: buyer.taxNumber ?? null,
          taxOffice: buyer.taxOffice ?? null,
        },
      };
    }

    const sellerMember = await SellerMember.findOne({
      userId: payload.userId,
      sellerId: payload.activeProfile.profileId,
    }).populate<{ sellerId: InstanceType<typeof Seller> }>("sellerId");

    if (!sellerMember || !sellerMember.sellerId) {
      throw new AuthError("Seller profile not found", 404);
    }

    const seller = sellerMember.sellerId;

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        phone: user.phone ?? null,
        status: user.status,
      },
      activeProfile: payload.activeProfile,
      subRole: sellerMember.subRole as SubRole,
      profile: {
        id: seller._id.toString(),
        storeName: seller.storeName,
        legalType: seller.legalType,
        businessType: seller.businessType,
        taxNumber: seller.taxNumber ?? null,
        taxOffice: seller.taxOffice ?? null,
        iban: seller.iban ?? null,
      },
    };
  }
}
