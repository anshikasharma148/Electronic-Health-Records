import { Schema, model, Document, Types } from "mongoose";

export interface BillingClaimDoc extends Document {
  patient: Types.ObjectId;
  code: string;
  amount: number;
  status: "submitted" | "paid" | "denied" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDoc extends Document {
  patient: Types.ObjectId;
  amount: number;
  date: Date;
  method: "card" | "cash" | "insurance";
  createdAt: Date;
  updatedAt: Date;
}

const BillingClaimSchema = new Schema<BillingClaimDoc>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    code: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["submitted", "paid", "denied", "pending"], default: "pending", index: true }
  },
  { timestamps: true }
);

const PaymentSchema = new Schema<PaymentDoc>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    method: { type: String, enum: ["card", "cash", "insurance"], required: true }
  },
  { timestamps: true }
);

BillingClaimSchema.index({ patient: 1, createdAt: -1 });
PaymentSchema.index({ patient: 1, date: -1 });

export const BillingClaim = model<BillingClaimDoc>("BillingClaim", BillingClaimSchema);
export const Payment = model<PaymentDoc>("Payment", PaymentSchema);
