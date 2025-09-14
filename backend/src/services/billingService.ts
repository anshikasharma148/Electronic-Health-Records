import { Types } from "mongoose";
import { BillingClaim, Payment } from "../models/Billing";
import billingCodes, { BillingCode } from "../data/billingCodes";

export const checkEligibility = async (_patientId: string) => {
  return { eligible: true, plan: "Standard", copay: 20 };
};

export const listClaims = async (patientId: string) => {
  return BillingClaim.find({ patient: patientId }).sort({ createdAt: -1 });
};

export const createClaim = async (payload: any) => {
  return BillingClaim.create(payload);
};

export const listPayments = async (patientId: string) => {
  return Payment.find({ patient: patientId }).sort({ date: -1 });
};

export const createPayment = async (payload: any) => {
  const data = { ...payload, date: payload.date ? new Date(payload.date) : new Date() };
  return Payment.create(data);
};

export const getBalance = async (patientId: string) => {
  const pid = new Types.ObjectId(patientId);

  const claimsByStatus = await BillingClaim.aggregate([
    { $match: { patient: pid } },
    { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } }
  ]);

  const claimsTotalAgg = await BillingClaim.aggregate([
    { $match: { patient: pid } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
  ]);

  const paymentsAgg = await Payment.aggregate([
    { $match: { patient: pid } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
  ]);

  const claimsTotal = claimsTotalAgg[0]?.total || 0;
  const paymentsTotal = paymentsAgg[0]?.total || 0;
  const balance = Math.max(0, claimsTotal - paymentsTotal);

  const byStatus: Record<string, { total: number; count: number }> = {};
  for (const row of claimsByStatus) {
    byStatus[row._id] = { total: row.total, count: row.count };
  }

  return {
    claimsTotal,
    paymentsTotal,
    balance,
    claimsByStatus: {
      pending: byStatus.pending || { total: 0, count: 0 },
      submitted: byStatus.submitted || { total: 0, count: 0 },
      paid: byStatus.paid || { total: 0, count: 0 },
      denied: byStatus.denied || { total: 0, count: 0 }
    }
  };
};

export const getReports = async () => {
  const totalClaims = await BillingClaim.countDocuments();
  const pending = await BillingClaim.countDocuments({ status: "pending" });
  const submitted = await BillingClaim.countDocuments({ status: "submitted" });
  const paid = await BillingClaim.countDocuments({ status: "paid" });
  const denied = await BillingClaim.countDocuments({ status: "denied" });

  const totals = await BillingClaim.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
  const paidTotals = await BillingClaim.aggregate([
    { $match: { status: "paid" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  return {
    totalClaims,
    pending,
    submitted,
    paid,
    denied,
    totalAmount: totals[0]?.total || 0,
    totalPaidAmount: paidTotals[0]?.total || 0
  };
};

export const listCodes = async (): Promise<BillingCode[]> => {
  return billingCodes;
};
