"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Plus, 
  Search, 
  DollarSign, 
  Phone, 
  ShoppingBag, 
  ChevronRight, 
  AlertCircle 
} from "lucide-react";
import { API_URL } from "@/lib/config";

interface Vendor {
  id: string;
  name: string;
  contactInfo: string | null;
  balance: number;
  _count?: {
    purchases: number;
  };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [totalPayables, setTotalPayables] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/vendors`);
      if (!res.ok) throw new Error("Failed to load vendors");
      const data = await res.json();
      setVendors(data.vendors || []);
      setTotalPayables(data.totalPayables || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.contactInfo && v.contactInfo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-blue-600" />
            Parts Suppliers & Vendors
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Manage parts suppliers, restock orders, and unpaid vendor bills (A/P).</p>
        </div>

        <Link
          href="/vendors/new"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 text-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </Link>
      </div>

      {/* Payables Summary Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Accounts Payable (A/P)</span>
          <div className="text-2xl md:text-3xl font-extrabold text-amber-600 mt-1">
            ${totalPayables.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Total unpaid balance owed across {vendors.length} supplier accounts</p>
        </div>

        <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <DollarSign className="h-6 w-6" />
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, phone, or contact info..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading vendors...</div>
        ) : error ? (
          <div className="py-8 text-center text-rose-500 text-sm flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No vendors found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery ? "No suppliers match your search." : "Add your first parts distributor or vendor to record purchase orders."}
            </p>
            <Link
              href="/vendors/new"
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Vendor
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredVendors.map((vendor) => (
              <Link
                key={vendor.id}
                href={`/vendors/${vendor.id}`}
                className="py-4 px-2 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition-colors group"
              >
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {vendor.name}
                    </h3>
                  </div>
                  {vendor.contactInfo && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">{vendor.contactInfo}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3" /> {vendor._count?.purchases || 0} purchase orders
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Balance Owed</span>
                    <span className={`text-sm font-extrabold ${Number(vendor.balance) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      ${Number(vendor.balance).toFixed(2)}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
