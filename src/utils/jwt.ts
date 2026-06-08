import jwt, { type SignOptions } from "jsonwebtoken";

export type ProfileType = "BUYER" | "SELLER";

export type SubRole =
  | "OWNER"
  | "MANAGER"
  | "PURCHASER"
  | "STOCK_KEEPER"
  | "FINANCE";

export interface JwtPayload {
  userId: string;
  email: string;
  activeProfile: {
    type: ProfileType;
    profileId: string;
  };
  subRole: SubRole;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

export function signToken(
  payload: JwtPayload,
  expiresIn: SignOptions["expiresIn"] = "7d",
): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded === "string" || !decoded) {
    throw new Error("Invalid token payload");
  }
  return decoded as JwtPayload;
}
