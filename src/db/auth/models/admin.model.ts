import { Schema, model } from 'mongoose';

export const ADMIN_ROLES = ['owner', 'helper'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

const stringField = { type: String, trim: true, maxlength: 500 };

const adminSchema = new Schema(
  {
    _id: { type: String, required: true },
    adminRole: { type: String, enum: ADMIN_ROLES, required: true },
    firstName: stringField,
    lastName: stringField,
    phone: { ...stringField, maxlength: 20 },
    createdBy: { type: String, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { strict: true }
);

adminSchema.index({ adminRole: 1 });

export const Admin = model('Admin', adminSchema);
