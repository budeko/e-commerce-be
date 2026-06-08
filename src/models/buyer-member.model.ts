import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { BUYER_SUB_ROLES } from "./enums.js";

const buyerMemberSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
    },
    subRole: {
      type: String,
      enum: BUYER_SUB_ROLES,
      required: true,
    },
  },
  { timestamps: true },
);

buyerMemberSchema.index({ userId: 1, buyerId: 1 }, { unique: true });

export type IBuyerMember = InferSchemaType<typeof buyerMemberSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BuyerMember =
  mongoose.models.BuyerMember ??
  mongoose.model("BuyerMember", buyerMemberSchema);
