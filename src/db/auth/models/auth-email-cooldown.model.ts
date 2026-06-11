import { Schema, model } from 'mongoose';

export const AUTH_EMAIL_COOLDOWN_PURPOSES = ['register', 'password_reset', 'email_verify'] as const;
export type AuthEmailCooldownPurpose = (typeof AUTH_EMAIL_COOLDOWN_PURPOSES)[number];

const authEmailCooldownSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    purpose: { type: String, enum: AUTH_EMAIL_COOLDOWN_PURPOSES, required: true },
    sentAt: { type: Date, required: true, expires: 60 },
  },
  { strict: true }
);

authEmailCooldownSchema.index({ email: 1, purpose: 1 }, { unique: true });

export const AuthEmailCooldown = model('AuthEmailCooldown', authEmailCooldownSchema);
