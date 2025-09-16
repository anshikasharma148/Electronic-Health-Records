"use client";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { useEffect, useState } from "react";
import { getUser } from "@/lib/auth";

const splitList = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(/[\n,]/g)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => !/^n\/?a$|^na$|^none$|^no$/i.test(s)); // drop NA/none/no

const parsePair = (item: string) =>
  item.split("|").map(p => p.trim()).filter(Boolean);

export default function Page() {
  const r = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u || (u.role !== "admin" && u.role !== "provider")) {
      alert(
        `You don't have permission to create patients.\n\nYour role: ${
          u?.role ?? "unknown"
        }\nAllowed roles: admin, provider`
      );
      r.replace("/patients");
    }
  }, [r]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const f = new FormData(e.currentTarget);

    // Build structured arrays that match your backend schema
    const allergies = splitList(f.get("allergies")).map((item) => {
      const [a, b] = parsePair(item);
      return { code: (a || item).toUpperCase(), description: b ?? item };
    });

    const conditions = splitList(f.get("conditions")).map((item) => {
      const [a, b] = parsePair(item);
      return { code: (a || item).toUpperCase(), description: b ?? item };
    });

    const medications = splitList(f.get("medications")).map((item) => {
      const [code, name, dosage] = parsePair(item);
      // Allow just a name: "calpol" => { name: "calpol" }
      return name
        ? { code, name, dosage }
        : { name: code || item };
    });

    const immunizations = splitList(f.get("immunizations")).map((item) => {
      const [code, name] = parsePair(item);
      return name
        ? { code, name }
        : { name: code || item };
    });

    const diagnoses = splitList(f.get("diagnoses")).map((item) => {
      const [codeMaybe, descMaybe] = parsePair(item);
      const code = (codeMaybe || item).toUpperCase(); // required by schema
      const description = descMaybe || item;
      return { code, description, type: "diagnosis" as const };
    });

    const payload = {
      firstName: String(f.get("firstName") || "").trim(),
      lastName: String(f.get("lastName") || "").trim(),
      dob: String(f.get("dob") || ""),
      gender: String(f.get("gender") || "other"),
      contact: {
        phone: String(f.get("phone") || ""),
        email: String(f.get("email") || ""),
        address: String(f.get("address") || ""),
      },
      allergies,
      conditions,
      medications,
      immunizations,
      diagnoses,
    };

    try {
      const { data } = await api.post(API.patients.root, payload);
      r.push(`/patients/${data._id}`);
    } catch (ex: any) {
      setErr(ex?.response?.data?.message || "Failed to create patient.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-3">
      <h1 className="text-xl font-semibold">New Patient</h1>

      {err && <div className="text-sm text-red-700">{err}</div>}

      <form className="space-y-3" onSubmit={submit}>
        <div className="grid md:grid-cols-4 gap-2">
          <Input name="firstName" placeholder="First name" required />
          <Input name="lastName" placeholder="Last name" required />
          <Input name="dob" type="date" required />
          <Select name="gender" defaultValue="other">
            <option value="male">male</option>
            <option value="female">female</option>
            <option value="other">other</option>
          </Select>

          <Input name="phone" placeholder="Phone" />
          <Input name="email" type="email" placeholder="Email" />
          <Input name="address" placeholder="Address" className="md:col-span-2" />
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-neutral-600 mb-1">
              Allergies (comma or newline). Optional formats: <code>dust</code> or <code>CODE|Description</code>
            </div>
            <textarea name="allergies" className="w-full border rounded-xl p-2" rows={2} />
          </div>

          <div>
            <div className="text-xs text-neutral-600 mb-1">
              Conditions (comma or newline). <code>asthma</code> or <code>ICD10|Asthma</code>
            </div>
            <textarea name="conditions" className="w-full border rounded-xl p-2" rows={2} />
          </div>

          <div>
            <div className="text-xs text-neutral-600 mb-1">
              Medications. <code>calpol</code> or <code>RX123|Atorvastatin|10mg</code>
            </div>
            <textarea name="medications" className="w-full border rounded-xl p-2" rows={2} />
          </div>

          <div>
            <div className="text-xs text-neutral-600 mb-1">
              Immunizations. <code>covid</code> or <code>FLU|Influenza</code>
            </div>
            <textarea name="immunizations" className="w-full border rounded-xl p-2" rows={2} />
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-neutral-600 mb-1">
              Diagnoses (code required). <code>E11.9|Type 2 diabetes</code> or just <code>malaria</code>
            </div>
            <textarea name="diagnoses" className="w-full border rounded-xl p-2" rows={2} />
          </div>
        </div>

        <Button disabled={loading}>{loading ? "..." : "Create"}</Button>
      </form>
    </div>
  );
}
