import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { BUYER_BUSINESS_TYPES, LEGAL_TYPES } from "./enums.js";

const buyerSchema = new Schema(
  {
    legalType: { type: String, enum: LEGAL_TYPES, required: true },
    businessType: {
      type: String,
      enum: BUYER_BUSINESS_TYPES,
      required: true,
    },
    taxNumber: { type: String },
    taxOffice: { type: String },
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

export type IBuyer = InferSchemaType<typeof buyerSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Buyer =
  mongoose.models.Buyer ?? mongoose.model("Buyer", buyerSchema);
