"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Building2,
  ChevronRight,
  Printer
} from "lucide-react";
import { API_URL } from "@/lib/config";

interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  customer: {
    id: string;
    companyName: string;
    contactPerson: string | null;
    phone: string | null;
  };
  vehicle: {
    id: string;
    unitNumber: string | null;
    vin: string;
    make: string | null;
    model: string | null;
    year: number | null;
  };
  _count?: {
    items: number;
    payments: number;
  };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const url = new URL(`${API_URL}/api/invoices`);
      if (selectedStatus !== "ALL") {
        url.searchParams.set("status", selectedStatus);
      }
      if (searchQuery.trim()) {
        url.searchParams.set("search", searchQuery.trim());
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">PAID</span>;
      case "PARTIALLY_PAID":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">PARTIAL</span>;
      case "UNPAID":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">UNPAID</span>;
      case "CLOSED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">CLOSED</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status || "DRAFT"}</span>;
    }
  };

  // Metrics calculations
  const totalBilled = invoices.reduce((acc, i) => acc + Number(i.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((acc, i) => acc + Number(i.amountPaid || 0), 0);
  const totalOutstanding = invoices.reduce((acc, i) => acc + Number(i.balance || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-blue-600" />
            Repair Invoices
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Create, manage, and track customer repair orders and balances.</p>
        </div>

        <Link
          href="/invoices/new"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 text-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </Link>
      </div>

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Invoiced</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              ${totalBilled.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Collected Payments</span>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              ${totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Outstanding Due</span>
            <div className="text-xl font-bold text-rose-600 mt-0.5">
              ${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { label: "All", value: "ALL" },
              { label: "Unpaid", value: "UNPAID" },
              { label: "Partial", value: "PARTIALLY_PAID" },
              { label: "Paid", value: "PAID" },
              { label: "Draft", value: "DRAFT" },
              { label: "Closed", value: "CLOSED" }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedStatus(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedStatus === tab.value
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Inv #, Customer, VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </form>
        </div>

        {/* Invoices List / Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading invoices...</div>
        ) : error ? (
          <div className="py-8 text-center text-rose-500 text-sm flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No invoices found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedStatus !== "ALL"
                ? "Try clearing your filters or search query to find invoices."
                : "Get started by creating your first truck repair invoice."}
            </p>
            <Link
              href="/invoices/new"
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Create Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Vehicle</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      <Link href={`/invoices/${inv.id}`} className="hover:text-blue-600 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600" />
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                        {inv.customer?.companyName || "N/A"}
                      </div>
                      {inv.customer?.contactPerson && (
                        <div className="text-[11px] text-slate-400 truncate">{inv.customer.contactPerson}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {inv.vehicle ? (
                        <div>
                          <span className="font-medium text-slate-800">
                            Unit #{inv.vehicle.unitNumber || "N/A"}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                            {inv.vehicle.year ? `${inv.vehicle.year} ` : ""}{inv.vehicle.make} {inv.vehicle.model}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      ${Number(inv.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      {Number(inv.balance) > 0 ? (
                        <span className="font-bold text-rose-600">${Number(inv.balance).toFixed(2)}</span>
                      ) : (
                        <span className="font-medium text-emerald-600">$0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        View <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
