"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
import { Table, T, Th, Td } from "@/components/ui/Table";
import { Paginated, Patient } from "@/types/api";
import { getUser } from "@/lib/auth";
import {
  FiSearch,
  FiPlus,
  FiUser,
  FiCalendar,
  FiUserX,
  FiCopy,
  FiExternalLink,
  FiCalendar as FiBook,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiFilter
} from "react-icons/fi";

export default function Page() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Patient> | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const u = getUser();
  const canCreate = !!u && (u.role === "admin" || u.role === "provider");
  const canDelete = !!u && u.role === "admin";

  const load = async (query = q, pg = page) => {
    setLoading(true);
    try {
      const r = await api.get(API.patients.root, { params: { q: query, page: pg, limit: 10 } });
      setData(r.data);
    } catch {
      setData({ items: [], page: 1, total: 0 } as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  const onUnauthorizedNew = () => {
    alert(
      `You don't have permission to create patients.\n\nYour role: ${u?.role ?? "unknown"}\nAllowed roles: admin, provider`
    );
  };

  const copyToClipboard = (id: string) => {
    navigator.clipboard?.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!canDelete) return;
    const ok = confirm(`Delete patient "${name}"?\n\nThis cannot be undone.`);
    if (!ok) return;

    try {
      setDeletingId(id);
      await api.delete(API.patients.one(id));

      // Optimistically update list
      setData(prev => {
        if (!prev) return prev;
        const items = prev.items.filter(p => p._id !== id);
        const next = { ...prev, items, total: Math.max(0, (prev.total || 0) - 1) };
        return next as Paginated<Patient>;
      });

      // If the page becomes empty and we're not on the first page, go back one page
      setTimeout(() => {
        setDeletingId(null);
        setData(curr => {
          if (curr && curr.items.length === 0 && page > 1) {
            setPage(p => Math.max(1, p - 1));
          } else {
            // refresh current page to keep pagination/total accurate
            load();
          }
          return curr;
        });
      }, 100);
    } catch (e: any) {
      setDeletingId(null);
      alert(e?.response?.data?.message || "Failed to delete patient.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FiUser className="text-blue-600" /> 
            Patient Management
          </h1>
          <p className="text-gray-500 mt-2">
            Search, view, and manage patient records
          </p>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search patients by name, phone, or email..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
            
            <Button 
              onClick={() => setPage(1)} 
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <FiSearch size={16} /> Search
            </Button>
            
            {canCreate ? (
              <Link
                href="/patients/new"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors w-full md:w-auto justify-center"
              >
                <FiPlus size={16} /> New Patient
              </Link>
            ) : (
              <button
                onClick={onUnauthorizedNew}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 cursor-not-allowed w-full md:w-auto justify-center"
                title="Only Admin/Provider can create patients"
              >
                <FiPlus size={16} /> New Patient
              </button>
            )}
          </div>

          {!canCreate && (
            <div className="mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg flex items-center gap-2">
              <FiInfo className="text-amber-600" />
              Read-only access for role “{u?.role}”. Creating patients is disabled.
            </div>
          )}
        </div>

        {/* Results Count */}
        {data && data.items && data.items.length > 0 && (
          <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
            <FiFilter size={14} />
            Showing {data.items.length} of {data.total} patients
          </div>
        )}

        {/* Patients Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            // Skeleton loading state
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <Table>
              <T>
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Patient Information</Th>
                    <Th>Date of Birth</Th>
                    <Th>Gender</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                      <Td>
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-800">
                            {p.firstName} {p.lastName}
                          </div>
                          {/* <div className="text-sm text-gray-500 mt-1">
                            {p.email || 'No email'}
                          </div> */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                              {p._id.substring(0, 8)}...
                            </span>
                            <button
                              type="button"
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              title="Copy Patient ID"
                              onClick={() => copyToClipboard(p._id)}
                            >
                              <FiCopy size={12} />
                              {copiedId === p._id ? 'Copied!' : 'Copy ID'}
                            </button>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FiCalendar className="text-gray-400" />
                          {new Date(p.dob).toLocaleDateString()}
                        </div>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {p.gender}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <Link 
                            href={`/patients/${p._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            <FiEye size={14} /> View
                          </Link>
                          <Link 
                            href={`/appointments?patient=${p._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            <FiBook size={14} /> Book
                          </Link>

                          {/* Delete (admin only) */}
                          {canDelete && (
                            <Button
                              variant="outline"
                              onClick={() => handleDelete(p._id, `${p.firstName} ${p.lastName}`)}
                              className="inline-flex items-center gap-1 text-red-700 border-red-200 hover:bg-red-50"
                              disabled={deletingId === p._id}
                            >
                              <FiUserX size={14} />
                              {deletingId === p._id ? "Deleting..." : "Delete"}
                            </Button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </T>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FiUserX className="text-gray-300 text-4xl mx-auto mb-3" />
              <p>{q ? 'No patients found matching your search' : 'No patients found'}</p>
              <p className="text-sm mt-1">
                {q ? 'Try adjusting your search terms' : 'Create a new patient to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.items && data.items.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Page {data?.page ?? page} of {Math.ceil((data?.total ?? 0) / 10)}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1"
              >
                <FiChevronLeft size={16} /> Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={(data?.items?.length ?? 0) < 10}
                className="flex items-center gap-1"
              >
                Next <FiChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
