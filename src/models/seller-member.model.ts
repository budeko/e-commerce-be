import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { SELLER_SUB_ROLES } from "./enums.js";

const sellerMemberSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    subRole: {
      type: String,
      enum: SELLER_SUB_ROLES,
      required: true,
    },
  },
  { timestamps: true },
);

sellerMemberSchema.index({ userId: 1, sellerId: 1 }, { unique: true });

export type ISellerMember = InferSchemaType<typeof sellerMemberSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SellerMember =
  mongoose.models.SellerMember ??
  mongoose.model("SellerMember", sellerMemberSchema);
