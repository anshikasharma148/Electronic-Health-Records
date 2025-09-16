// backend/src/services/billingService.ts
import { Types } from "mongoose";
import { BillingClaim, Payment } from "../models/Billing";
import billingCodes, { BillingCode } from "../data/billingCodes";

// ---- Eligibility (stub) ----
export const checkEligibility = async (_patientId: string) => {
  return { eligible: true, plan: "Standard", copay: 20 };
};

// -----------------------------
// Claims - list with filters/pagination/sorting
// -----------------------------
type ListClaimsOpts = {
  patientId?: string;
  providerId?: string;
  status?: "pending" | "submitted" | "paid" | "denied" | string;
  page?: number;
  limit?: number;
  sort?: string;            // default: createdAt
  order?: "asc" | "desc";   // default: desc
};

export const listClaims = async (optsOrPatientId: string | ListClaimsOpts) => {
  // Backward-compat: if a string was passed previously, treat it as patientId
  const opts: ListClaimsOpts =
    typeof optsOrPatientId === "string" ? { patientId: optsOrPatientId } : (optsOrPatientId || {});

  const q: any = {};

  if (opts.patientId && Types.ObjectId.isValid(opts.patientId)) {
    q.patient = new Types.ObjectId(opts.patientId);
  }
  if (opts.providerId) q.providerId = opts.providerId;

  const allowedStatuses = new Set(["pending", "submitted", "paid", "denied"]);
  if (opts.status && allowedStatuses.has(String(opts.status))) {
    q.status = opts.status;
  }

  const page  = Math.max(Number(opts.page || 1), 1);
  const limit = Math.min(Math.max(Number(opts.limit || 100), 1), 200);
  const skip  = (page - 1) * limit;

  const sortField = opts.sort || "createdAt";
  const orderNum  = (opts.order === "asc" ? 1 : -1) as 1 | -1;
  const sortObj: Record<string, 1 | -1> = { [sortField]: orderNum };

  const [items, total] = await Promise.all([
    BillingClaim.find(q).sort(sortObj).skip(skip).limit(limit)
      .populate("patient", "firstName lastName dob gender")
      .lean(),
    BillingClaim.countDocuments(q),
  ]);

  return { items, page, total };
};

// -----------------------------
// Claims - create with validation
// -----------------------------
type CreateClaimPayload = {
  patient: string;
  providerId: string;
  code: string;
  type: "CPT" | "ICD" | "HCPCS";
  description?: string;
  amount: number | string;
  status?: "pending" | "submitted" | "paid" | "denied";
};

export const createClaim = async (payload: CreateClaimPayload) => {
  const errors: string[] = [];

  if (!payload.patient || !Types.ObjectId.isValid(payload.patient)) errors.push("invalid_patient");
  if (!payload.providerId) errors.push("providerId_required");
  if (!payload.code) errors.push("code_required");
  if (!payload.type || !["CPT", "ICD", "HCPCS"].includes(payload.type)) errors.push("type_required");

  const amountNum = Number(payload.amount);
  if (!Number.isFinite(amountNum)) errors.push("amount_required");

  if (errors.length) {
    const err = new Error(errors.join(", "));
    (err as any).status = 400;
    throw err;
  }

  const doc = await BillingClaim.create({
    patient: new Types.ObjectId(payload.patient),
    providerId: payload.providerId,
    code: payload.code,
    type: payload.type,
    description: payload.description,
    amount: amountNum,
    status: payload.status || "pending",
  });

  return await doc.populate("patient", "firstName lastName dob gender");
};

// -----------------------------
// Payments (unchanged, minor hardening on date)
// -----------------------------
export const listPayments = async (patientId: string) => {
  const q: any = {};
  if (patientId && Types.ObjectId.isValid(patientId)) {
    q.patient = new Types.ObjectId(patientId);
  }
  return Payment.find(q).sort({ date: -1 });
};

export const createPayment = async (payload: any) => {
  const data = { ...payload, date: payload.date ? new Date(payload.date) : new Date() };
  if (data.patient && Types.ObjectId.isValid(data.patient)) {
    data.patient = new Types.ObjectId(data.patient);
  }
  return Payment.create(data);
};

// -----------------------------
// Balance & Reports (unchanged)
// -----------------------------
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
  for (const row of claimsByStatus) byStatus[row._id] = { total: row.total, count: row.count };

  return {
    claimsTotal,
    paymentsTotal,
    balance,
    claimsByStatus: {
      pending:   byStatus.pending   || { total: 0, count: 0 },
      submitted: byStatus.submitted || { total: 0, count: 0 },
      paid:      byStatus.paid      || { total: 0, count: 0 },
      denied:    byStatus.denied    || { total: 0, count: 0 },
    }
  };
};

export const getReports = async () => {
  const totalClaims = await BillingClaim.countDocuments();
  const pending   = await BillingClaim.countDocuments({ status: "pending" });
  const submitted = await BillingClaim.countDocuments({ status: "submitted" });
  const paid      = await BillingClaim.countDocuments({ status: "paid" });
  const denied    = await BillingClaim.countDocuments({ status: "denied" });

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

// add near other exports; keep the rest of your file as-is

export const updateClaimStatus = async (
  id: string,
  status: "pending" | "submitted" | "paid" | "denied"
) => {
  return BillingClaim.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  )
    .populate("patient", "firstName lastName")
    .lean();
};
