"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Patient } from "@/types/api";
import { getUser } from "@/lib/auth";

const splitList = (v: FormDataEntryValue | null | string) =>
  String(v ?? "")
    .split(/[\n,]/g)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => !/^n\/?a$|^na$|^none$|^no$/i.test(s));

const parsePair = (item: string) =>
  item.split("|").map(p => p.trim()).filter(Boolean);

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const u = getUser();
  const canEdit = !!u && (u.role === "admin" || u.role === "provider");

  useEffect(() => {
    api.get(API.patients.one(id)).then(r => setPatient(r.data));
  }, [id]);

  // Pre-fill textareas (canonical “CODE|Description” style where applicable)
  const prefill = useMemo(() => {
    if (!patient) return {
      allergies: "", conditions: "", medications: "", immunizations: "", diagnoses: ""
    };

    const allergies = (patient.allergies || [])
      .map(a => a.code ? `${a.code}|${a.description || ""}`.trim() : `${a.description || ""}`)
      .join("\n");

    const conditions = (patient.conditions || [])
      .map(c => c.code ? `${c.code}|${c.description || ""}`.trim() : `${c.description || ""}`)
      .join("\n");

    const medications = (patient.medications || [])
      .map(m => {
        if (m.code || m.dosage) return [m.code, m.name, m.dosage].filter(Boolean).join("|");
        return m.name || "";
      })
      .join("\n");

    const immunizations = (patient.immunizations || [])
      .map(i => i.code ? `${i.code}|${i.name || ""}`.trim() : `${i.name || ""}`)
      .join("\n");

    const diagnoses = (patient.diagnoses || [])
      .map(d => [d.code, d.description].filter(Boolean).join("|"))
      .join("\n");

    return { allergies, conditions, medications, immunizations, diagnoses };
  }, [patient]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!patient) return;
    setSaving(true);
    setErr(null);

    const f = new FormData(e.currentTarget);

    // Always allow contact edits
    const contact = {
      phone: String(f.get("phone") || ""),
      email: String(f.get("email") || ""),
      address: String(f.get("address") || "")
    };

    // Only build clinical arrays if the role can edit (form sections are hidden otherwise)
    let payload: any = { contact };

    if (canEdit) {
      const allergies = splitList(f.get("allergies")).map(item => {
        const [a, b] = parsePair(item);
        return { code: (a || item).toUpperCase(), description: b ?? item };
      });

      const conditions = splitList(f.get("conditions")).map(item => {
        const [a, b] = parsePair(item);
        return { code: (a || item).toUpperCase(), description: b ?? item };
      });

      const medications = splitList(f.get("medications")).map(item => {
        const [code, name, dosage] = parsePair(item);
        return name
          ? { code, name, dosage }
          : { name: code || item };
      });

      const immunizations = splitList(f.get("immunizations")).map(item => {
        const [code, name] = parsePair(item);
        return name
          ? { code, name }
          : { name: code || item };
      });

      const diagnoses = splitList(f.get("diagnoses")).map(item => {
        const [codeMaybe, descMaybe] = parsePair(item);
        const code = (codeMaybe || item).toUpperCase();
        const description = descMaybe || item;
        return { code, description, type: "diagnosis" as const };
      });

      payload = { ...payload, allergies, conditions, medications, immunizations, diagnoses };
    }

    try {
      const { data } = await api.put(API.patients.one(id), payload);
      setPatient(data);
    } catch (ex: any) {
      setErr(ex?.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (!patient) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">
          {patient.firstName} {patient.lastName}
        </h1>
        <div className="text-sm text-neutral-600">
          {new Date(patient.dob).toLocaleDateString()} • {patient.gender}
        </div>
        <div className="text-xs text-neutral-500 mt-1">ID: {patient._id}</div>
      </div>

      {err && <div className="text-sm text-red-700">{err}</div>}

      <form className="space-y-4" onSubmit={submit}>
        {/* Contact */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Contact</div>
          <Input name="phone" placeholder="Phone" defaultValue={patient.contact?.phone || ""} />
          <Input name="email" placeholder="Email" defaultValue={patient.contact?.email || ""} />
          <Input name="address" placeholder="Address" defaultValue={patient.contact?.address || ""} />
        </div>

        {/* Clinical sections */}
        {canEdit ? (
          <>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-medium">Allergies</div>
                <div className="text-xs text-neutral-600 mb-1">
                  One per line. <code>CODE|Description</code> or just <code>Description</code>
                </div>
                <textarea
                  name="allergies"
                  defaultValue={prefill.allergies}
                  className="w-full border rounded-xl p-2"
                  rows={3}
                />
              </div>

              <div>
                <div className="text-sm font-medium">Conditions</div>
                <div className="text-xs text-neutral-600 mb-1">
                  <code>ICD10|Description</code> or just <code>Description</code>
                </div>
                <textarea
                  name="conditions"
                  defaultValue={prefill.conditions}
                  className="w-full border rounded-xl p-2"
                  rows={3}
                />
              </div>

              <div>
                <div className="text-sm font-medium">Medications</div>
                <div className="text-xs text-neutral-600 mb-1">
                  <code>CODE|Name|Dosage</code> or just <code>Name</code>
                </div>
                <textarea
                  name="medications"
                  defaultValue={prefill.medications}
                  className="w-full border rounded-xl p-2"
                  rows={3}
                />
              </div>

              <div>
                <div className="text-sm font-medium">Immunizations</div>
                <div className="text-xs text-neutral-600 mb-1">
                  <code>CODE|Name</code> or just <code>Name</code>
                </div>
                <textarea
                  name="immunizations"
                  defaultValue={prefill.immunizations}
                  className="w-full border rounded-xl p-2"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <div className="text-sm font-medium">Diagnoses</div>
                <div className="text-xs text-neutral-600 mb-1">
                  <code>CODE|Description</code> (if only one value is provided, it will be used as both code and description)
                </div>
                <textarea
                  name="diagnoses"
                  defaultValue={prefill.diagnoses}
                  className="w-full border rounded-xl p-2"
                  rows={3}
                />
              </div>
            </div>
          </>
        ) : (
          // Read-only view for viewer/billing
          <div className="grid md:grid-cols-2 gap-3">
            <ReadonlyList title="Allergies" items={(patient.allergies || []).map(a => a.description || a.code)} />
            <ReadonlyList title="Conditions" items={(patient.conditions || []).map(c => c.description || c.code)} />
            <ReadonlyList title="Medications" items={(patient.medications || []).map(m => [m.name, m.dosage].filter(Boolean).join(" • "))} />
            <ReadonlyList title="Immunizations" items={(patient.immunizations || []).map(i => i.name || i.code)} />
            <ReadonlyList title="Diagnoses" className="md:col-span-2" items={(patient.diagnoses || []).map(d => [d.code, d.description].filter(Boolean).join(" — "))} />
          </div>
        )}

        <Button disabled={saving}>{saving ? "..." : "Save"}</Button>
      </form>
    </div>
  );
}

function ReadonlyList({ title, items, className = "" }: { title: string; items: (string | undefined)[]; className?: string }) {
  const clean = (items || []).map(s => (s || "").trim()).filter(Boolean);
  return (
    <div className={`border rounded-xl p-3 ${className}`}>
      <div className="text-sm font-medium mb-2">{title}</div>
      {clean.length === 0 ? (
        <div className="text-xs text-neutral-500">No records</div>
      ) : (
        <ul className="list-disc pl-5 text-sm">
          {clean.map((s, i) => (<li key={i}>{s}</li>))}
        </ul>
      )}
    </div>
  );
}
