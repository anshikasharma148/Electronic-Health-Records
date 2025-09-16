"use client";
import { useEffect, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Table, T, Th, Td } from "@/components/ui/Table";
import { getUser } from "@/lib/auth";
import useToast from "@/hooks/useToast";
import {
  FiDollarSign,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSearch,
  FiPlus,
  FiFilter,
  FiRefreshCw,
  FiUserCheck,
  FiCreditCard,
  FiPieChart,
  FiTrendingUp,
  FiInfo,
  FiCopy,
  FiEdit,
  FiArrowUp,
  FiArrowDown
} from "react-icons/fi";

const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(s);

export default function Page() {
  const u = getUser();
  const allowed = !!u && (u.role === "admin" || u.role === "billing");
  const { show, Toast } = useToast();

  // ---------------- Reports ----------------
  const [reports, setReports] = useState<any>(null);
  const [repErr, setRepErr] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    setRepErr(null);
    api
      .get(API.billing.reports)
      .then((r) => setReports(r.data))
      .catch(() => {
        setReports(null);
        setRepErr("Failed to load reports.");
      });
  }, [allowed]);

  // ---------------- Codes (search) ----------------
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [codes, setCodes] = useState<any[]>([]);
  useEffect(() => {
    if (!allowed) return;
    api
      .get(API.billing.codes, { params: { q, type, limit: 100 } })
      .then((r) => {
        const list = Array.isArray(r.data?.items)
          ? r.data.items
          : Array.isArray(r.data)
          ? r.data
          : [];
        setCodes(list);
      })
      .catch(() => setCodes([]));
  }, [allowed, q, type]);

  // ---------------- Create Claim ----------------
  const [cPatient, setCPatient] = useState("");
  const [cProvider, setCProvider] = useState("provider123");
  const [cCode, setCCode] = useState("");
  const [cType, setCType] = useState<"CPT" | "ICD" | "HCPCS" | "">("");
  const [cDesc, setCDesc] = useState("");
  const [cAmount, setCAmount] = useState<string>("");
  const [cErr, setCErr] = useState<string | null>(null);
  const canCreate = useMemo(
    () =>
      allowed &&
      isObjectId(cPatient) &&
      !!cProvider &&
      !!cCode &&
      !!cType &&
      cAmount !== "" &&
      !Number.isNaN(Number(cAmount)),
    [allowed, cPatient, cProvider, cCode, cType, cAmount]
  );

  const prefillFromCode = (row: any) => {
    setCCode(String(row.code || ""));
    setCType((String(row.type || "") as any) || "");
    setCDesc(String(row.description || ""));
    if (row.fee != null) setCAmount(String(row.fee));
    show("↪️ Code applied to claim form");
    document.getElementById("create-claim")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const createClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setCErr(null);
    try {
      const payload = {
        patient: cPatient.trim(),
        providerId: cProvider.trim(),
        code: cCode.trim(),
        type: cType,
        description: cDesc.trim() || undefined,
        amount: Number(cAmount),
        status: "pending",
      };
      await api.post(API.billing.claims, payload);
      show("✅ Claim created");
      // reset form
      setCPatient("");
      setCProvider("provider123");
      setCCode("");
      setCType("");
      setCDesc("");
      setCAmount("");
      // refresh claims & balance
      loadClaims();
      if (isObjectId(payload.patient)) {
        setBPatient(payload.patient); // reflect in Balance/Payments section too
        loadBalance(payload.patient);
        loadPayments(payload.patient);
      }
    } catch (ex: any) {
      const msg = ex?.response?.data?.message || "Failed to create claim.";
      setCErr(msg);
      show(`⚠️ ${msg}`);
    }
  };

  // ---------------- Claims List / Manage ----------------
  const [claims, setClaims] = useState<any[]>([]);
  const [clErr, setClErr] = useState<string | null>(null);

  // filters
  const [fPatient, setFPatient] = useState("");
  const [fProvider, setFProvider] = useState("");
  const [fStatus, setFStatus] = useState<"" | "pending" | "paid" | "denied">("");

  const loadClaims = async () => {
    if (!allowed) return;
    try {
      setClErr(null);
      const params: Record<string, string> = { limit: "100" };
      // 🔧 use patientId (not patient) so server-side filter works
      if (isObjectId(fPatient)) params.patientId = fPatient.trim();
      if (fProvider.trim()) params.providerId = fProvider.trim();
      if (fStatus) params.status = fStatus;
      const r = await api.get(API.billing.claims, { params });
      const list = Array.isArray(r.data?.items)
        ? r.data.items
        : Array.isArray(r.data)
        ? r.data
        : [];
      setClaims(list);
    } catch {
      setClaims([]);
      setClErr("Failed to load claims.");
    }
  };
  useEffect(() => {
    loadClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  const updateStatus = async (id: string, status: "paid" | "denied" | "pending") => {
    try {
      await api.put(`${API.billing.claims}/${id}`, { status });
      show(`✅ Claim marked ${status}`);
      loadClaims();
      // also refresh balance/payments if a patient filter is present
      if (isObjectId(fPatient)) {
        loadBalance(fPatient);
        loadPayments(fPatient);
      }
    } catch (ex: any) {
      show(`⚠️ ${ex?.response?.data?.message || "Failed to update claim."}`);
    }
  };

  // ---------------- Eligibility ----------------
  const [ePatient, setEPatient] = useState("");
  const [elig, setElig] = useState<any>(null);
  const [eligErr, setEligErr] = useState<string | null>(null);

  const checkEligibility = async () => {
    setEligErr(null);
    setElig(null);
    if (!isObjectId(ePatient)) {
      setEligErr("Enter a valid PatientId (24-hex).");
      return;
    }
    try {
      const r = await api.get(API.billing.eligibility, { params: { patientId: ePatient } });
      setElig(r.data);
      show("📄 Eligibility fetched");
    } catch (ex: any) {
      setEligErr(ex?.response?.data?.message || "Failed to check eligibility.");
    }
  };

  // ---------------- Balance & Payments ----------------
  const [bPatient, setBPatient] = useState("");
  const [balance, setBalance] = useState<any>(null);
  const [balErr, setBalErr] = useState<string | null>(null);

  const loadBalance = async (pid: string) => {
    if (!isObjectId(pid)) return;
    try {
      setBalErr(null);
      const r = await api.get(API.billing.balance, { params: { patientId: pid } });
      setBalance(r.data);
    } catch (ex: any) {
      setBalance(null);
      setBalErr(ex?.response?.data?.message || "Failed to load balance.");
    }
  };

  const [payments, setPayments] = useState<any[]>([]);
  const [payErr, setPayErr] = useState<string | null>(null);

  const loadPayments = async (pid: string) => {
    if (!isObjectId(pid)) return;
    try {
      setPayErr(null);
      const r = await api.get(API.billing.payments, { params: { patientId: pid } });
      const list = Array.isArray(r.data) ? r.data : [];
      setPayments(list);
    } catch (ex: any) {
      setPayments([]);
      setPayErr(ex?.response?.data?.message || "Failed to load payments.");
    }
  };

  // record a payment
  const [pAmount, setPAmount] = useState("");
  const [pDate, setPDate] = useState("");
  const [pNote, setPNote] = useState("");

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isObjectId(bPatient)) return show("⚠️ Enter a valid PatientId before recording payment.");
    if (!pAmount || Number.isNaN(Number(pAmount))) return show("⚠️ Enter a valid amount.");

    try {
      await api.post(API.billing.payments, {
        patient: bPatient,
        amount: Number(pAmount),
        date: pDate || undefined,
        note: pNote || undefined,
      });
      show("💳 Payment recorded");
      setPAmount("");
      setPDate("");
      setPNote("");
      loadBalance(bPatient);
      loadPayments(bPatient);
    } catch (ex: any) {
      show(`⚠️ ${ex?.response?.data?.message || "Failed to record payment."}`);
    }
  };

  // ---------------- Render ----------------
  if (!allowed) {
    return (
      <div className="space-y-3 p-6">
        <h1 className="text-xl font-semibold">Billing</h1>
        <div className="rounded-lg border p-4 bg-amber-50 text-amber-800 text-sm">
          Your role <b>{u?.role ?? "unknown"}</b> does not have access to Billing.
          Ask an admin to grant the <code className="px-1">billing</code> role if needed.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiDollarSign className="text-blue-600" /> Billing Dashboard
        </h1>
        <Button onClick={loadClaims} className="flex items-center gap-2">
          <FiRefreshCw /> Refresh
        </Button>
      </div>

      {/* Reports */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
          <FiPieChart className="text-blue-500" /> Reports Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 flex items-center gap-1 mb-1">
              <FiFileText className="text-gray-400" /> Total Claims
            </div>
            <div className="text-2xl font-semibold text-gray-800">{reports?.totalClaims ?? 0}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 flex items-center gap-1 mb-1">
              <FiCheckCircle className="text-green-500" /> Paid
            </div>
            <div className="text-2xl font-semibold text-green-600">{reports?.paid ?? 0}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 flex items-center gap-1 mb-1">
              <FiXCircle className="text-red-500" /> Denied
            </div>
            <div className="text-2xl font-semibold text-red-600">{reports?.denied ?? 0}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-500 flex items-center gap-1 mb-1">
              <FiDollarSign className="text-blue-500" /> Total Amount
            </div>
            <div className="text-2xl font-semibold text-blue-600">${reports?.totalAmount ?? 0}</div>
          </div>
        </div>
        {repErr && <div className="text-sm text-red-600 mt-3 bg-red-50 p-2 rounded-lg flex items-center gap-2"><FiInfo /> {repErr}</div>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Eligibility */}
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
            <FiUserCheck className="text-blue-500" /> Eligibility Check
          </h2>
          <div className="grid sm:grid-cols-4 gap-2">
            <Input 
              placeholder="PatientId (24-hex)" 
              value={ePatient} 
              onChange={(e) => setEPatient(e.target.value)}
              className="sm:col-span-3"
            />
            <Button onClick={checkEligibility} className="flex items-center justify-center gap-1">
              <FiSearch size={14} /> Check
            </Button>
            {eligErr && <div className="sm:col-span-4 text-sm text-red-600 bg-red-50 p-2 rounded-lg flex items-center gap-2"><FiInfo /> {eligErr}</div>}
          </div>
          {elig && (
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              <div className="rounded-lg border border-gray-200 p-3 bg-gradient-to-br from-white to-gray-50">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <FiInfo className="text-gray-400" /> Eligible
                </div>
                <div className={`text-lg font-semibold ${elig.eligible ? 'text-green-600' : 'text-red-600'}`}>
                  {String(elig.eligible ?? false)}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 bg-gradient-to-br from-white to-gray-50">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <FiFileText className="text-gray-400" /> Plan
                </div>
                <div className="text-lg font-semibold text-gray-800">{elig.plan ?? "-"}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 bg-gradient-to-br from-white to-gray-50">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <FiDollarSign className="text-gray-400" /> Copay
                </div>
                <div className="text-lg font-semibold text-gray-800">${elig.copay ?? 0}</div>
              </div>
            </div>
          )}
        </div>

        {/* Create Claim */}
        <div id="create-claim" className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
            <FiPlus className="text-blue-500" /> Create Claim
          </h2>
          <form className="grid gap-3" onSubmit={createClaim}>
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                placeholder="PatientId (24-hex)"
                value={cPatient}
                onChange={(e) => setCPatient(e.target.value)}
              />
              <Input
                placeholder="ProviderId"
                value={cProvider}
                onChange={(e) => setCProvider(e.target.value)}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <Input placeholder="Code" value={cCode} onChange={(e) => setCCode(e.target.value)} />
              <Select value={cType} onChange={(e) => setCType(e.target.value as any)}>
                <option value="">Type</option>
                <option value="CPT">CPT</option>
                <option value="ICD">ICD</option>
                <option value="HCPCS">HCPCS</option>
              </Select>
              <Input
                placeholder="Amount"
                type="number"
                step="0.01"
                value={cAmount}
                onChange={(e) => setCAmount(e.target.value)}
              />
            </div>
            <Input
              placeholder="Description (optional)"
              value={cDesc}
              onChange={(e) => setCDesc(e.target.value)}
            />
            <Button disabled={!canCreate} className="flex items-center justify-center gap-1">
              <FiPlus size={14} /> Create Claim
            </Button>
          </form>
          {cErr && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg flex items-center gap-2"><FiInfo /> {cErr}</div>}
          <div className="text-xs text-gray-500 flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
            <FiInfo className="text-blue-500" />
            <span>Tip: Click a row in "Code Search" to auto-fill code, type, description, and fee.</span>
          </div>
        </div>
      </div>

      {/* Claims list + filters */}
      <div className="space-y-3 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
            <FiFileText className="text-blue-500" /> Claims Management
          </h2>
          <div className="flex-1"></div>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Filter PatientId"
              value={fPatient}
              onChange={(e) => setFPatient(e.target.value)}
              className="min-w-[180px]"
            />
            <Input
              placeholder="Filter ProviderId"
              value={fProvider}
              onChange={(e) => setFProvider(e.target.value)}
              className="min-w-[180px]"
            />
            <Select value={fStatus} onChange={(e) => setFStatus(e.target.value as any)} className="min-w-[140px]">
              <option value="">All statuses</option>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="denied">denied</option>
            </Select>
            <Button onClick={loadClaims} className="flex items-center gap-1">
              <FiFilter size={14} /> Filter
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFPatient("");
                setFProvider("");
                setFStatus("");
                loadClaims();
              }}
              className="flex items-center gap-1"
            >
              <FiRefreshCw size={14} /> Clear
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <Table>
            <T>
              <thead className="bg-gray-50">
                <tr>
                  <Th>Patient</Th>
                  <Th>Provider</Th>
                  <Th>Code</Th>
                  <Th>Description</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c: any) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <Td>
                      {typeof c.patient === "string"
                        ? c.patient
                        : c?.patient?.firstName
                        ? `${c.patient.firstName} ${c.patient.lastName}`
                        : "Unknown"}
                    </Td>
                    <Td>{c.providerId}</Td>
              
                    <Td>
                      <div className="font-mono">{c.code}</div>
                    </Td>
                    <Td>
                      <div className="max-w-[420px] truncate" title={c.description}>
                        {c.description}
                      </div>
                    </Td>
                    <Td>${c.amount}</Td>
                    <Td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : c.status === 'denied'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {c.status}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => updateStatus(c._id, "paid")}
                          className="flex items-center gap-1 text-green-700 border-green-200 hover:bg-green-50"
                        >
                          <FiCheckCircle size={14} /> Paid
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => updateStatus(c._id, "denied")}
                          className="flex items-center gap-1 text-red-700 border-red-200 hover:bg-red-50"
                        >
                          <FiXCircle size={14} /> Deny
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => updateStatus(c._id, "pending")}
                          className="flex items-center gap-1 text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                        >
                          <FiClock size={14} /> Pending
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </T>
          </Table>
        </div>
        {clErr && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg flex items-center gap-2 mt-3"><FiInfo /> {clErr}</div>}
        {claims.length === 0 && !clErr && (
          <div className="text-center py-8 text-gray-500 flex flex-col items-center">
            <FiFileText className="text-gray-300 text-3xl mb-2" />
            <p>No claims found</p>
          </div>
        )}
      </div>

      {/* Code Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
          <FiSearch className="text-blue-500" /> Code Search
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <Input
            placeholder="Search code or description"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Input
            placeholder="CPT|ICD|HCPCS"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <Table>
            <T>
              <thead className="bg-gray-50">
                <tr>
                  <Th>Code</Th>
                  <Th>Description</Th>
                  <Th>Fee</Th>
                  <Th>Type</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {codes?.map((c: any) => (
                  <tr key={`${c.type}-${c.code}`} className="hover:bg-gray-50 transition-colors">

                    <Td>
                      <div className="font-mono font-medium">{c.code}</div>
                    </Td>
                    <Td>
                      <div className="max-w-[520px] truncate" title={c.description}>
                        {c.description}
                      </div>
                    </Td>
                    <Td>${c.fee}</Td>
                    <Td>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {c.type}
                      </span>
                    </Td>
                    <Td>
                      <Button 
                        variant="outline" 
                        onClick={() => prefillFromCode(c)}
                        className="flex items-center gap-1"
                      >
                        <FiCopy size={14} /> Use
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </T>
          </Table>
        </div>
        {codes.length === 0 && (
          <div className="text-center py-8 text-gray-500 flex flex-col items-center">
            <FiSearch className="text-gray-300 text-3xl mb-2" />
            <p>No codes found</p>
          </div>
        )}
      </div>

      {/* Balance & Payments */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
          <FiCreditCard className="text-blue-500" /> Balance & Payments
        </h2>

        <div className="grid md:grid-cols-4 gap-3">
          <Input
            placeholder="PatientId (24-hex)"
            value={bPatient}
            onChange={(e) => setBPatient(e.target.value)}
            className="md:col-span-2"
          />
          <Button
            onClick={() => {
              if (!isObjectId(bPatient)) {
                show("⚠️ Enter a valid PatientId (24-hex).");
                return;
              }
              loadBalance(bPatient);
              loadPayments(bPatient);
            }}
            className="flex items-center justify-center gap-1"
          >
            <FiTrendingUp size={14} /> Load
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setBPatient("");
              setBalance(null);
              setPayments([]);
              setBalErr(null);
              setPayErr(null);
            }}
            className="flex items-center justify-center gap-1"
          >
            <FiRefreshCw size={14} /> Clear
          </Button>
        </div>

        {balErr && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg flex items-center gap-2"><FiInfo /> {balErr}</div>}

        {balance && (
          <div className="grid sm:grid-cols-4 gap-4 mt-4">
            <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-white to-gray-50">
              <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <FiArrowUp className="text-gray-400" /> Claims Total
              </div>
              <div className="text-xl font-semibold text-gray-800">${balance.claimsTotal}</div>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-white to-gray-50">
              <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <FiArrowDown className="text-gray-400" /> Payments Total
              </div>
              <div className="text-xl font-semibold text-green-600">${balance.paymentsTotal}</div>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-white to-blue-50">
              <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <FiDollarSign className="text-blue-500" /> Balance
              </div>
              <div className="text-xl font-semibold text-blue-600">${balance.balance}</div>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-white to-gray-50">
              <div className="text-xs text-gray-500 mb-2">By Status</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-yellow-600 flex items-center gap-1"><FiClock size={12} /> pending:</span>
                  <span>{balance.claimsByStatus?.pending?.count ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600 flex items-center gap-1"><FiCheckCircle size={12} /> paid:</span>
                  <span>{balance.claimsByStatus?.paid?.count ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600 flex items-center gap-1"><FiXCircle size={12} /> denied:</span>
                  <span>{balance.claimsByStatus?.denied?.count ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Record a payment */}
        <div className="rounded-lg border border-gray-200 p-4 mt-4 bg-gray-50">
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <FiCreditCard className="text-blue-500" /> Record Payment
          </div>
          <form className="grid md:grid-cols-4 gap-3" onSubmit={recordPayment}>
            <Input
              placeholder="Amount"
              type="number"
              step="0.01"
              value={pAmount}
              onChange={(e) => setPAmount(e.target.value)}
            />
            <Input
              placeholder="Date (optional)"
              type="datetime-local"
              value={pDate}
              onChange={(e) => setPDate(e.target.value)}
            />
            <Input
              placeholder="Note (optional)"
              value={pNote}
              onChange={(e) => setPNote(e.target.value)}
            />
            <Button className="flex items-center justify-center gap-1">
              <FiPlus size={14} /> Save
            </Button>
          </form>
        </div>

        {/* Payments list */}
        <div className="mt-4">
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <FiCreditCard className="text-blue-500" /> Payment History
          </div>
          {payErr && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg flex items-center gap-2 mb-3"><FiInfo /> {payErr}</div>}
          {payments.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <T>
                  <thead className="bg-gray-50">
                    <tr>
                      <Th>Date</Th>
                      <Th>Amount</Th>
                      <Th>Note</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                        <Td>{p.date ? new Date(p.date).toLocaleString() : "-"}</Td>
                        <Td>
  <div className="font-medium text-green-600">${p.amount}</div>
</Td>
                        <Td>
                          <div className="max-w-[420px] truncate" title={p.note}>
                            {p.note}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </T>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50">
              <FiCreditCard className="text-gray-300 text-3xl mx-auto mb-2" />
              <p>No payments recorded</p>
            </div>
          )}
        </div>
      </div>

      <Toast />
    </div>
  );
}