"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Table, T, Th, Td } from "@/components/ui/Table";
import { getUser } from "@/lib/auth";
import useToast from "@/hooks/useToast";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiUsers,
  FiFilter,
  FiX,
  FiEdit,
  FiCheckCircle,
  FiTrash2,
  FiSearch,
  FiPlus,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiAlertCircle,
  FiArrowRight,
  FiLoader
} from "react-icons/fi";

const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(s);
const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (isoOrDate: string | Date) => {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export default function Page() {
  const sp = useSearchParams();
  const { show, Toast } = useToast();

  const u = getUser();
  const canBook = !!u && (u.role === "admin" || u.role === "provider");

  // ----------------- list / filters -----------------
  const [items, setItems] = useState<any[]>([]);
  const [listErr, setListErr] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [fPatient, setFPatient] = useState(sp.get("patient") ?? "");
  const [fProvider, setFProvider] = useState("");
  const [fDate, setFDate] = useState(""); // YYYY-MM-DD

  const loadList = async () => {
    try {
      setListLoading(true);
      setListErr(null);
      const params: Record<string, string> = { limit: "50" };
      if (isObjectId(fPatient)) params.patient = fPatient;
      if (fProvider.trim()) params.providerId = fProvider.trim();
      if (fDate) params.date = fDate;
      const r = await api.get(API.appointments.root, { params });
      setItems(Array.isArray(r.data?.items) ? r.data.items : []);
    } catch {
      setItems([]);
      setListErr("Failed to load appointments.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------- booking form -----------------
  const [bPatient, setBPatient] = useState(sp.get("patient") ?? "");
  const [bProvider, setBProvider] = useState("provider123");
  const [bStart, setBStart] = useState(""); // datetime-local
  const [bEnd, setBEnd] = useState("");
  const [bReason, setBReason] = useState("");
  const [bookErr, setBookErr] = useState<string | null>(null);
  const [bookLoading, setBookLoading] = useState(false);

  const canSubmit = useMemo(
    () => canBook && isObjectId(bPatient) && !!bProvider && !!bStart && !!bEnd,
    [canBook, bPatient, bProvider, bStart, bEnd]
  );

  const conflictMsg = (data: any) => {
    if (!data) return "Time conflict with an existing appointment.";
    const start = data.conflictStart ? new Date(data.conflictStart).toLocaleString() : "";
    const end = data.conflictEnd ? new Date(data.conflictEnd).toLocaleString() : "";
    const type = data.conflictType === "patient" ? "patient" : "provider";
    return `Conflict with existing ${type} appointment (${start} - ${end}).`;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canBook || bookLoading) return;

    setBookErr(null);

    if (!isObjectId(bPatient)) return setBookErr("Enter a valid PatientId (24-character hex).");
    if (!bProvider) return setBookErr("ProviderId is required.");
    if (!bStart || !bEnd) return setBookErr("Start and End are required.");
    if (new Date(bStart) >= new Date(bEnd)) return setBookErr("End must be after Start.");

    try {
      setBookLoading(true);
      await api.post(API.appointments.root, {
        patient: bPatient,
        providerId: bProvider,
        start: new Date(bStart).toISOString(),
        end: new Date(bEnd).toISOString(),
        reason: bReason || undefined,
      });
      show("✅ Appointment booked");
      setBStart("");
      setBEnd("");
      setBReason("");
      loadList();
    } catch (ex: any) {
      const status = ex?.response?.status;
      const data = ex?.response?.data;
      const msg = status === 409 ? conflictMsg(data) : data?.message || "Booking failed.";
      setBookErr(msg);
      show(`⚠️ ${msg}`);
    } finally {
      setBookLoading(false);
    }
  };

  // ----------------- availability helper -----------------
  const [avProvider, setAvProvider] = useState("provider123");
  const [avDate, setAvDate] = useState(""); // YYYY-MM-DD
  const [avMins, setAvMins] = useState("30");
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [avErr, setAvErr] = useState<string | null>(null);
  const [showAvailability, setShowAvailability] = useState(false);

  const findSlots = async () => {
    try {
      setAvErr(null);
      setSlots([]);
      if (!avProvider || !avDate) {
        setAvErr("Provider and Date are required.");
        return;
      }
      const r = await api.get(API.appointments.availability, {
        params: { providerId: avProvider, date: avDate, slotMins: avMins || "30" },
      });
      setSlots(Array.isArray(r.data?.slots) ? r.data.slots : []);
    } catch (ex: any) {
      setAvErr(ex?.response?.data?.message || "Failed to fetch availability.");
    }
  };

  const takeSlot = (s: { start: string; end: string }) => {
    setBStart(toLocalInput(s.start));
    setBEnd(toLocalInput(s.end));
    document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ----------------- reschedule / cancel / complete -----------------
  const [editId, setEditId] = useState<string | null>(null);
  const [rStart, setRStart] = useState("");
  const [rEnd, setREnd] = useState("");
  const [rReason, setRReason] = useState("");
  const [rErr, setRErr] = useState<string | null>(null);
  const [resLoading, setResLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const beginReschedule = (a: any) => {
    setEditId(a._id);
    setRStart(toLocalInput(a.start));
    setREnd(toLocalInput(a.end));
    setRReason(a.reason || "");
    document.getElementById("reschedule-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const saveReschedule = async () => {
    if (!editId || resLoading) return;
    setRErr(null);
    if (!rStart || !rEnd) {
      setRErr("Start and End are required.");
      return;
    }
    if (new Date(rStart) >= new Date(rEnd)) {
      setRErr("End must be after Start.");
      return;
    }
    try {
      setResLoading(true);
      await api.put(API.appointments.one(editId), {
        start: new Date(rStart).toISOString(),
        end: new Date(rEnd).toISOString(),
        reason: rReason || undefined,
      });
      show("✅ Appointment rescheduled");
      setEditId(null);
      setRStart("");
      setREnd("");
      setRReason("");
      loadList();
    } catch (ex: any) {
      const status = ex?.response?.status;
      const data = ex?.response?.data;
      const msg = status === 409 ? conflictMsg(data) : data?.message || "Reschedule failed.";
      setRErr(msg);
      show(`⚠️ ${msg}`);
    } finally {
      setResLoading(false);
    }
  };

  const cancelAppt = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      setCancelingId(id);
      await api.delete(API.appointments.one(id));
      show("🗑️ Appointment cancelled");
      if (editId === id) setEditId(null);
      loadList();
    } catch (ex: any) {
      show(`⚠️ ${ex?.response?.data?.message || "Cancel failed."}`);
    } finally {
      setCancelingId(null);
    }
  };

  const completeAppt = async (id: string) => {
    try {
      setCompletingId(id);
      await api.put(API.appointments.one(id), { status: "completed" });
      show("✅ Marked as completed");
      loadList();
    } catch (ex: any) {
      show(`⚠️ ${ex?.response?.data?.message || "Update failed."}`);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiCalendar className="text-blue-600" /> Appointments
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage and schedule patient appointments</p>
        </div>
        <Button onClick={loadList} className="flex items-center gap-2" disabled={listLoading}>
          <FiRefreshCw className={listLoading ? "animate-spin" : ""} />
          {listLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <button 
          className="flex items-center gap-2 text-gray-700 font-medium mb-4"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? <FiChevronUp /> : <FiChevronDown />}
          <FiFilter className="text-blue-500" /> Filter Appointments
        </button>
        
        {showFilters && (
          <div className="grid lg:grid-cols-4 gap-4 animate-fadeIn">
            <Input
              placeholder="Filter by PatientId (24-hex)"
              value={fPatient}
              onChange={(e) => setFPatient(e.target.value)}
            />
            <Input
              placeholder="Filter by ProviderId"
              value={fProvider}
              onChange={(e) => setFProvider(e.target.value)}
            />
            <Input
              placeholder="Filter by Date (YYYY-MM-DD)"
              value={fDate}
              onChange={(e) => setFDate(e.target.value)}
            />
            <div className="flex gap-2">
              <Button className="flex-1 flex items-center justify-center gap-2" onClick={loadList} disabled={listLoading}>
                <FiSearch size={16} /> {listLoading ? "Filtering..." : "Filter"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => {
                  setFPatient("");
                  setFProvider("");
                  setFDate("");
                  loadList();
                }}
                disabled={listLoading}
              >
                <FiX size={16} /> Clear
              </Button>
            </div>
          </div>
        )}
        {listErr && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-4 flex items-center gap-2">
            <FiAlertCircle /> {listErr}
          </div>
        )}
      </div>

      {/* Booking form */}
      <div id="booking-form" className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiPlus className="text-blue-500" /> Schedule New Appointment
        </h2>
        
        {canBook ? (
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                name="patient"
                placeholder="PatientId (24-hex)"
                value={bPatient}
                onChange={(e) => setBPatient(e.target.value)}
              />
              <Input
                name="providerId"
                placeholder="ProviderId"
                value={bProvider}
                onChange={(e) => setBProvider(e.target.value)}
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                name="start"
                type="datetime-local"
                value={bStart}
                onChange={(e) => setBStart(e.target.value)}
              />
              <Input 
                name="end" 
                type="datetime-local" 
                value={bEnd} 
                onChange={(e) => setBEnd(e.target.value)}
              />
            </div>
            
            <Input
              name="reason"
              placeholder="Reason (optional)"
              value={bReason}
              onChange={(e) => setBReason(e.target.value)}
            />
            
            <Button 
              disabled={!canSubmit || bookLoading} 
              className="flex items-center justify-center gap-2 w-full md:w-auto"
            >
              {bookLoading ? <FiLoader className="animate-spin" /> : <FiCalendar />}
              {bookLoading ? "Booking..." : "Book Appointment"}
            </Button>
          </form>
        ) : (
          <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg flex items-center gap-2">
            <FiInfo className="text-amber-600" />
            Read-only access for role “{u?.role ?? "unknown"}”. Booking is disabled.
          </div>
        )}
        {bookErr && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-4 flex items-center gap-2">
            <FiAlertCircle /> {bookErr}
          </div>
        )}
      </div>

      {/* Availability helper */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <button 
          className="flex items-center gap-2 text-gray-700 font-medium mb-4"
          onClick={() => setShowAvailability(!showAvailability)}
        >
          {showAvailability ? <FiChevronUp /> : <FiChevronDown />}
          <FiClock className="text-blue-500" /> Check Availability
        </button>
        
        {showAvailability && (
          <div className="animate-fadeIn">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <Input 
                placeholder="ProviderId" 
                value={avProvider} 
                onChange={(e) => setAvProvider(e.target.value)}
              />
              <Input 
                placeholder="YYYY-MM-DD" 
                value={avDate} 
                onChange={(e) => setAvDate(e.target.value)}
              />
              <Input 
                placeholder="Slot minutes" 
                value={avMins} 
                onChange={(e) => setAvMins(e.target.value)}
              />
              <Button onClick={findSlots} className="flex items-center justify-center gap-2">
                <FiSearch size={16} /> Find slots
              </Button>
            </div>
            {avErr && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4 flex items-center gap-2">
                <FiAlertCircle /> {avErr}
              </div>
            )}

            {slots.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {slots.map((s, i) => (
                  <button
                    key={`${s.start}-${i}`}
                    type="button"
                    onClick={() => takeSlot(s)}
                    className="text-left rounded-lg border border-gray-200 p-4 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    title="Click to fill the booking form"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        Available
                      </div>
                      <FiArrowRight className="text-blue-500" />
                    </div>
                    <div className="text-xs text-gray-500">Start</div>
                    <div className="font-medium text-gray-800">{new Date(s.start).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-2">End</div>
                    <div className="font-medium text-gray-800">{new Date(s.end).toLocaleString()}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reschedule inline card */}
      {canBook && editId && (
        <div id="reschedule-card" className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm animate-fadeIn">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiEdit className="text-blue-500" /> Reschedule Appointment
          </h2>
          <div className="grid md:grid-cols-5 gap-4">
            <Input 
              type="datetime-local" 
              value={rStart} 
              onChange={(e) => setRStart(e.target.value)}
              className="md:col-span-2"
            />
            <Input 
              type="datetime-local" 
              value={rEnd} 
              onChange={(e) => setREnd(e.target.value)}
              className="md:col-span-2"
            />
            <div className="flex gap-2">
              <Button onClick={saveReschedule} disabled={resLoading} className="flex-1 flex items-center justify-center gap-2">
                {resLoading ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
                {resLoading ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditId(null)} disabled={resLoading} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
          <Input 
            placeholder="Reason (optional)" 
            value={rReason} 
            onChange={(e) => setRReason(e.target.value)}
            className="mt-4"
          />
          {rErr && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-4 flex items-center gap-2">
              <FiAlertCircle /> {rErr}
            </div>
          )}
        </div>
      )}

      {/* Appointments table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiCalendar className="text-blue-500" /> Appointments List
        </h2>
        
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiCalendar className="text-gray-300 text-4xl mx-auto mb-3" />
            <p>No appointments found</p>
            <p className="text-sm mt-1">Try adjusting your filters or book a new appointment</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <T>
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Patient</Th>
                    <Th>Provider</Th>
                    <Th>Start</Th>
                    <Th>End</Th>
                    <Th>Status</Th>
                    {canBook && <Th>Actions</Th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((a: any) => {
                    const patientName =
                      typeof a.patient === "string"
                        ? a.patient
                        : a?.patient
                        ? `${a.patient.firstName ?? ""} ${a.patient.lastName ?? ""}`.trim()
                        : "Unknown";
                    return (
                      <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                        <Td>
                          <div className="font-medium text-gray-800">{patientName || "Unknown"}</div>
                        </Td>
                        <Td>{a.providerId}</Td>
                        <Td>{new Date(a.start).toLocaleString()}</Td>
                        <Td>{new Date(a.end).toLocaleString()}</Td>
                        <Td>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            a.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : a.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {a.status}
                          </span>
                        </Td>
                        {canBook && (
                          <Td>
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => beginReschedule(a)}
                                className="flex items-center gap-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                              >
                                <FiEdit /> Reschedule
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => completeAppt(a._id)}
                                disabled={completingId === a._id}
                                className="flex items-center gap-1 text-green-700 border-green-200 hover:bg-green-50"
                              >
                                {completingId === a._id ? (
                                  <FiLoader className="animate-spin" />
                                ) : (
                                  <FiCheckCircle />
                                )}
                                Complete
                              </Button>
                              <Button 
                                onClick={() => cancelAppt(a._id)} 
                                disabled={cancelingId === a._id}
                                className="flex items-center gap-1 text-red-700 border-red-200 hover:bg-red-50"
                              >
                                {cancelingId === a._id ? (
                                  <FiLoader className="animate-spin" />
                                ) : (
                                  <FiTrash2 />
                                )}
                                Cancel
                              </Button>
                            </div>
                          </Td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </T>
            </Table>
          </div>
        )}
      </div>

      <Toast />
    </div>
  );
}
