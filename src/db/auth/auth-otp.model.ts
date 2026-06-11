import { Schema, model } from 'mongoose';

export const AUTH_OTP_PURPOSES = ['email_verify', 'password_reset'] as const;
export type AuthOtpPurpose = (typeof AUTH_OTP_PURPOSES)[number];

const authOtpSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    purpose: { type: String, enum: AUTH_OTP_PURPOSES, required: true },
    codeHash: { type: String, required: true, maxlength: 128 },
    expiresAt: { type: Date, required: true, expires: 0 },
    attemptCount: { type: Number, default: 0, min: 0 },
  },
  { strict: true }
);

authOtpSchema.index({ userId: 1, purpose: 1 }, { unique: true });

export const AuthOtp = model('AuthOtp', authOtpSchema);
