"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Truck, 
  FileText, 
  Package, 
  Plus, 
  ArrowUpRight, 
  DollarSign, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  Receipt
} from "lucide-react";
import { API_URL } from "@/lib/config";

interface DashboardStats {
  activeCustomers: number;
  vehicles: number;
  totalParts: number;
  totalRevenue: number;
  outstandingBalance: number;
  unpaidInvoices: number;
  totalExpenses?: number;
  vendorPayables?: number;
  netProfit?: number;
  recentInvoices: any[];
  recentCustomers: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeCustomers: 0,
    vehicles: 0,
    totalParts: 0,
    totalRevenue: 0,
    outstandingBalance: 0,
    unpaidInvoices: 0,
    totalExpenses: 0,
    vendorPayables: 0,
    netProfit: 0,
    recentInvoices: [],
    recentCustomers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dashboard/stats`);
      if (!res.ok) throw new Error("Failed to load dashboard statistics");
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">PAID</span>;
      case "PARTIALLY_PAID":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">PARTIAL</span>;
      case "UNPAID":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">UNPAID</span>;
      case "CLOSED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">CLOSED</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status || "DRAFT"}</span>;
    }
  };

  const net = stats.netProfit !== undefined ? stats.netProfit : stats.totalRevenue - (stats.totalExpenses || 0);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24 md:pb-12 space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <LayoutDashboard className="h-7 w-7 text-blue-600" />
            Shop Financials & Operations
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Real-time summary of repair revenues, operating expenses, and receivables.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/invoices/new"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-xs"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
          <Link
            href="/expenses"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-colors shadow-sm text-xs"
          >
            <Receipt className="h-4 w-4 text-slate-500" />
            Log Expense
          </Link>
          <Link
            href="/customers/new"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-colors shadow-sm text-xs"
          >
            <Plus className="h-4 w-4 text-slate-400" />
            New Customer
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Financial Health Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Profit</span>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${net >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              {net >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl md:text-3xl font-extrabold ${net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {loading ? "..." : `$${net.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Collected Revenue − Expenses
            </div>
          </div>
        </div>

        {/* Total Collected Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Collected Sales</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {loading ? "..." : `$${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">
              Gross Cash Inflow
            </div>
          </div>
        </div>

        {/* Total Operating Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Operating Expenses</span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-extrabold text-rose-600">
              {loading ? "..." : `$${(stats.totalExpenses || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <Link href="/expenses" className="text-[11px] text-rose-600 hover:underline mt-1 flex items-center gap-0.5 font-medium">
              View expense breakdown &rarr;
            </Link>
          </div>
        </div>

        {/* Outstanding Receivables (A/R) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Outstanding A/R</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {loading ? "..." : `$${stats.outstandingBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">
              {stats.unpaidInvoices} unpaid / partial invoice{stats.unpaidInvoices === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Customers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Customers</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{loading ? "..." : stats.activeCustomers}</div>
          </div>
          <Link href="/customers" className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="h-4 w-4" />
          </Link>
        </div>

        {/* Fleet Vehicles */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Fleet Units</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{loading ? "..." : stats.vehicles}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Truck className="h-4 w-4" />
          </div>
        </div>

        {/* Stock Parts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Catalog Parts</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{loading ? "..." : stats.totalParts}</div>
          </div>
          <Link href="/inventory" className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Package className="h-4 w-4" />
          </Link>
        </div>

        {/* Vendor Payables (A/P) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Vendor Payables (A/P)</span>
            <div className="text-xl font-bold text-amber-600 mt-0.5">
              ${(stats.vendorPayables || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <Link href="/vendors" className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Quick Launch Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/invoices/new"
          className="group p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">Repair Order</span>
            <h3 className="text-base font-bold mt-0.5">New Invoice</h3>
            <p className="text-blue-100 text-[11px]">Bill customer for repair</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
            <ArrowUpRight className="h-4 w-4 text-white" />
          </div>
        </Link>

        <Link
          href="/expenses"
          className="group p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Expenses</span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">Log Overhead</h3>
            <p className="text-slate-500 text-[11px]">Rent, fuel, tools & payroll</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-100 group-hover:bg-rose-50 group-hover:text-rose-600 flex items-center justify-center transition-colors text-slate-500">
            <Receipt className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/vendors"
          className="group p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Suppliers</span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">Vendors & Restock</h3>
            <p className="text-slate-500 text-[11px]">Buy parts & track A/P bills</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-100 group-hover:bg-amber-50 group-hover:text-amber-600 flex items-center justify-center transition-colors text-slate-500">
            <Building2 className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/inventory/new"
          className="group p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Catalog</span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">Add Part</h3>
            <p className="text-slate-500 text-[11px]">Create inventory SKU</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center transition-colors text-slate-500">
            <Package className="h-4 w-4" />
          </div>
        </Link>
      </div>

      {/* Two Column Section: Recent Invoices & Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Recent Invoices
            </h2>
            <Link href="/invoices" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>

          {stats.recentInvoices.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No invoices created yet</p>
              <Link href="/invoices/new" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                Create first repair invoice
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm font-mono">{inv.invoiceNumber}</span>
                      {getStatusBadge(inv.status)}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {inv.customer?.companyName || "Unknown Customer"}
                      {inv.vehicle ? ` • Unit #${inv.vehicle.unitNumber || inv.vehicle.make || "Truck"}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-900">${Number(inv.totalAmount).toFixed(2)}</div>
                    {Number(inv.balance) > 0 && (
                      <div className="text-xs font-medium text-rose-600">Due: ${Number(inv.balance).toFixed(2)}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Customers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Recent Customers
            </h2>
            <Link href="/customers" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>

          {stats.recentCustomers.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No customers found</p>
              <Link href="/customers/new" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                Add your first customer
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentCustomers.map((cust) => (
                <Link
                  key={cust.id}
                  href={`/customers/${cust.id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{cust.companyName}</div>
                    <div className="text-xs text-slate-500">
                      {cust.contactPerson ? `${cust.contactPerson} • ` : ""}
                      {cust.vehicles?.length || 0} vehicle{cust.vehicles?.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                      {cust._count?.invoices || 0} Inv
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
