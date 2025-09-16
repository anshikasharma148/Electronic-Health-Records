"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { getUser } from "@/lib/auth";

type Reports = {
  totalClaims: number;
  paid: number;
  pending: number;
  totalAmount: number;
};

export default function Page() {
  const role = getUser()?.role;
  const canSeeBilling = role === "admin" || role === "billing";

  const [data, setData] = useState<Reports>({
    totalClaims: 0,
    paid: 0,
    pending: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    if (!canSeeBilling) return; // avoid 403 spam for provider/viewer
    api
      .get(API.billing.reports)
      .then((r) => setData(r.data as Reports))
      .catch(() => {});
  }, [canSeeBilling]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Total Claims</div>
          <div className="text-2xl font-semibold">{data.totalClaims}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Paid</div>
          <div className="text-2xl font-semibold">{data.paid}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Pending</div>
          <div className="text-2xl font-semibold">{data.pending}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Total Amount</div>
          <div className="text-2xl font-semibold">{data.totalAmount}</div>
        </div>
      </div>

      {!canSeeBilling && (
        <p className="text-sm text-amber-700">
          You’re signed in as <span className="font-medium">{role}</span>. Billing metrics are hidden for this role.
        </p>
      )}
    </div>
  );
}
