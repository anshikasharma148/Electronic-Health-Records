"use client";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { useEffect, useState } from "react";
import { getUser } from "@/lib/auth";

// Icons (using Heroicons)
import {
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BeakerIcon,
  HeartIcon,
  PencilIcon,
  ShieldCheckIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";

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
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);

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
      setSuccess(true);
      
      // Success animation before redirecting
      setTimeout(() => {
        r.push(`/patients/${data._id}`);
      }, 1500);
    } catch (ex: any) {
      setErr(ex?.response?.data?.message || "Failed to create patient.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header with icon and title */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <UserIcon className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800">New Patient Registration</h1>
      </div>

      {/* Success message with animation */}
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center space-x-2 animate-fade-in">
          <CheckBadgeIcon className="h-5 w-5" />
          <span>Patient created successfully! Redirecting...</span>
        </div>
      )}

      {/* Error message */}
      {err && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2 animate-fade-in">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>{err}</span>
        </div>
      )}

      <form className="space-y-6" onSubmit={submit}>
        {/* Personal Information Card */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
            Personal Information
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Input 
                name="firstName" 
                placeholder="First name" 
                required 
                className="pl-9"
              />
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="relative">
              <Input 
                name="lastName" 
                placeholder="Last name" 
                required 
                className="pl-9"
              />
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="relative">
              <Input 
                name="dob" 
                type="date" 
                required 
                className="pl-9"
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="relative">
              <Select 
                name="gender" 
                defaultValue="other"
                className="pl-9 appearance-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
            <PhoneIcon className="h-5 w-5 mr-2 text-blue-500" />
            Contact Information
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Input 
                name="phone" 
                placeholder="Phone" 
                className="pl-9"
              />
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="relative">
              <Input 
                name="email" 
                type="email" 
                placeholder="Email" 
                className="pl-9"
              />
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="relative md:col-span-2">
              <Input 
                name="address" 
                placeholder="Address" 
                className="pl-9"
              />
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Medical Information Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Allergies */}
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 transition-all hover:shadow-sm">
            <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
              <BeakerIcon className="h-5 w-5 mr-2 text-red-500" />
              Allergies
            </h3>
            <div className="text-xs text-gray-500 mb-2">
              Comma or newline separated. Format: <code>dust</code> or <code>CODE|Description</code>
            </div>
            <div className="relative">
              <textarea 
                name="allergies" 
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all" 
                rows={3} 
                placeholder="Peanuts, PEN|Penicillin"
              />
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-green-50 p-5 rounded-xl border border-green-100 transition-all hover:shadow-sm">
            <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
              <HeartIcon className="h-5 w-5 mr-2 text-green-600" />
              Conditions
            </h3>
            <div className="text-xs text-gray-500 mb-2">
              Comma or newline separated. Format: <code>asthma</code> or <code>ICD10|Asthma</code>
            </div>
            <div className="relative">
              <textarea 
                name="conditions" 
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all" 
                rows={3} 
                placeholder="Hypertension, J45|Asthma"
              />
            </div>
          </div>

          {/* Medications */}
          <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 transition-all hover:shadow-sm">
            <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
              <PencilIcon className="h-5 w-5 mr-2 text-purple-600" />
              Medications
            </h3>
            <div className="text-xs text-gray-500 mb-2">
              Format: <code>calpol</code> or <code>RX123|Atorvastatin|10mg</code>
            </div>
            <div className="relative">
              <textarea 
                name="medications" 
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all" 
                rows={3} 
                placeholder="Aspirin, RX123|Atorvastatin|10mg"
              />
            </div>
          </div>

          {/* Immunizations */}
          <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100 transition-all hover:shadow-sm">
            <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2 text-yellow-600" />
              Immunizations
            </h3>
            <div className="text-xs text-gray-500 mb-2">
              Format: <code>covid</code> or <code>FLU|Influenza</code>
            </div>
            <div className="relative">
              <textarea 
                name="immunizations" 
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all" 
                rows={3} 
                placeholder="MMR, FLU|Influenza"
              />
            </div>
          </div>

          {/* Diagnoses - Full width */}
          <div className="md:col-span-2 bg-orange-50 p-5 rounded-xl border border-orange-100 transition-all hover:shadow-sm">
            <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
              <DocumentMagnifyingGlassIcon className="h-5 w-5 mr-2 text-orange-600" />
              Diagnoses
            </h3>
            <div className="text-xs text-gray-500 mb-2">
              Code required. Format: <code>E11.9|Type 2 diabetes</code> or <code>malaria</code>
            </div>
            <div className="relative">
              <textarea 
                name="diagnoses" 
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all" 
                rows={3} 
                placeholder="E11.9|Type 2 diabetes, Malaria"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button 
            disabled={loading} 
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all hover:shadow-md transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Patient...</span>
              </>
            ) : (
              <>
                <UserIcon className="h-5 w-5" />
                <span>Create Patient</span>
              </>
            )}
          </Button>
        </div>
      </form>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}