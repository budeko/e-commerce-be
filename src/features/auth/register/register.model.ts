import { Schema, model, Types } from 'mongoose';

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['buyer', 'seller'], required: true },
  createdAt: { type: Date, default: Date.now },
});

const buyerSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
});

const sellerSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
});

export const User = model('User', userSchema);
export const Buyer = model('Buyer', buyerSchema);
export const Seller = model('Seller', sellerSchema);
