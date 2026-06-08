import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { LEGAL_TYPES, SELLER_BUSINESS_TYPES } from "./enums.js";

const sellerSchema = new Schema(
  {
    storeName: { type: String, required: true, trim: true },
    legalType: { type: String, enum: LEGAL_TYPES, required: true },
    businessType: {
      type: String,
      enum: SELLER_BUSINESS_TYPES,
      required: true,
    },
    taxNumber: { type: String },
    taxOffice: { type: String },
    idCardNumber: { type: String },
    iban: { type: String },
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

export type ISeller = InferSchemaType<typeof sellerSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Seller =
  mongoose.models.Seller ?? mongoose.model("Seller", sellerSchema);
