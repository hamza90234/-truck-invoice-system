"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Building2, Phone, ChevronRight, Link as LinkIcon, Check, Clock, XCircle, CheckCircle2 } from "lucide-react";
import { API_URL } from "@/lib/config";
import { apiFetch } from "@/lib/api";

interface Customer {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  status?: string;
  createdAt?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState<"APPROVED" | "PENDING" | "REJECTED" | "ALL">("APPROVED");
  const [copiedLink, setCopiedLink] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchCustomers = async (statusFilter?: string) => {
    try {
      setLoading(true);
      const url = statusFilter && statusFilter !== "ALL" 
        ? `${API_URL}/api/customers?status=${statusFilter}`
        : `${API_URL}/api/customers?status=ALL`;
        
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/customers/pending/count`);
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.count || 0);
      }
    } catch (err) {
      console.log("Could not load pending count:", err);
    }
  };

  useEffect(() => {
    fetchCustomers(statusTab);
    fetchPendingCount();
  }, [statusTab]);

  const handleCopyOnboardLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const onboardUrl = `${origin}/onboard`;
    navigator.clipboard.writeText(onboardUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const filteredCustomers = customers.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.contactPerson && c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-blue-600" />
            Customers
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            Manage client accounts, review self-onboarding applications, and view history.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Copy Onboarding Link Button */}
          <button
            onClick={handleCopyOnboardLink}
            type="button"
            className={`flex items-center justify-center gap-2 font-medium px-4 py-2.5 rounded-xl border transition-all text-sm shadow-xs cursor-pointer ${
              copiedLink 
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
            }`}
            title="Copy the public self-onboarding registration link to text or email to customers"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4 text-blue-600" />
                <span>Copy Onboarding Link</span>
              </>
            )}
          </button>

          {/* Add Customer Button */}
          <Link 
            href="/customers/new" 
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusTab("APPROVED")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusTab === "APPROVED"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Active Customers
          </button>

          <button
            onClick={() => setStatusTab("PENDING")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusTab === "PENDING"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Pending Approvals</span>
            {pendingCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statusTab === "PENDING" ? "bg-amber-800 text-white" : "bg-amber-200 text-amber-800"
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusTab("REJECTED")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusTab === "REJECTED"
                ? "bg-slate-800 text-white shadow-md shadow-slate-800/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Rejected
          </button>

          <button
            onClick={() => setStatusTab("ALL")}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusTab === "ALL"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            All
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by company, contact, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm md:text-base placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Customer List Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center bg-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-white">
            {error}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white">
            {statusTab === "PENDING" ? (
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="font-medium text-slate-700">No pending onboarding applications!</p>
                <p className="text-xs text-slate-400">Share your onboarding link with new customers to have them submit their info online.</p>
              </div>
            ) : (
              "No customers found in this view. Try a different search or filter."
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCustomers.map((customer) => {
              const isPending = customer.status === "PENDING";
              const isRejected = customer.status === "REJECTED";

              return (
                <Link 
                  key={customer.id} 
                  href={`/customers/${customer.id}`}
                  className={`flex items-center p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors group cursor-pointer ${
                    isPending ? "bg-amber-50/40 hover:bg-amber-50/70" : ""
                  }`}
                >
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 mr-4 transition-colors ${
                    isPending 
                      ? "bg-amber-100 text-amber-700 group-hover:bg-amber-200" 
                      : isRejected 
                      ? "bg-rose-100 text-rose-700 group-hover:bg-rose-200" 
                      : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                  }`}>
                    {isPending ? <Clock className="h-5 w-5" /> : isRejected ? <XCircle className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 truncate">
                        {customer.companyName}
                      </h3>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                          Pending Review
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                          Rejected
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 text-[13px] md:text-sm text-slate-500">
                      {customer.contactPerson && (
                        <span className="truncate">{customer.contactPerson}</span>
                      )}
                      {customer.phone && (
                        <span className="flex items-center gap-1 truncate">
                          <Phone className="h-3 w-3 hidden sm:block" />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex items-center gap-2">
                    {isPending && (
                      <span className="hidden sm:inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-blue-100">
                        Review & Approve
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <Link 
        href="/customers/new" 
        className="md:hidden fixed bottom-20 right-6 h-14 w-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_rgba(37,99,235,0.4)] active:scale-95 transition-transform z-20"
        aria-label="Add Customer"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
