import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { USER_STATUSES } from "./enums.js";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    phone: { type: String },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: "PENDING",
    },
  },
  { timestamps: true },
);

export type IUser = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User =
  mongoose.models.User ?? mongoose.model("User", userSchema);
