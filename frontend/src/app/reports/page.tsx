"use client";

import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Building2 } from "lucide-react";

export default function ReportsPage() {
  const [pnL, setPnL] = useState<any>(null);
  const [arAp, setArAp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [pnlRes, arapRes] = await Promise.all([
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports/profit-loss`),
        apiFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports/ar-ap`)
      ]);
      
      if (pnlRes.ok && arapRes.ok) {
        setPnL(await pnlRes.json());
        setArAp(await arapRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 animate-pulse">Loading reports...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Financial Reports
        </h1>
        <p className="text-slate-500 mt-1">Detailed breakdown of your business financials.</p>
      </div>

      {/* Profit & Loss Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Profit & Loss Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">Itemized labor earnings, vendor parts cost, gross profit & operating margins</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              Gross Margin: {pnL?.grossMarginPct ?? 0}%
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
              Total Invoiced: ${(pnL?.totalBilled || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Primary Financial Pillars */}
        <div className="p-4 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 border-b border-slate-100">
          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl">
            <div className="flex items-center justify-between text-blue-700 font-semibold text-xs mb-1">
              <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Labor Revenue</span>
              <span className="text-[10px] bg-blue-200/60 px-1.5 py-0.2 rounded font-bold">100% Margin</span>
            </div>
            <div className="text-2xl font-black text-blue-950">${(pnL?.laborRevenue || 0).toFixed(2)}</div>
            <p className="text-[11px] text-blue-600/80 mt-1">Labor & mobile road calls</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-700 font-semibold text-xs mb-1">
              <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Parts Sold</span>
              <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-bold">Revenue</span>
            </div>
            <div className="text-2xl font-black text-slate-900">${(pnL?.partsRevenue || 0).toFixed(2)}</div>
            <p className="text-[11px] text-slate-500 mt-1">Customer billed parts</p>
          </div>

          <div className="p-4 bg-orange-50/70 border border-orange-100 rounded-xl">
            <div className="flex items-center justify-between text-orange-700 font-semibold text-xs mb-1">
              <span className="flex items-center gap-1.5"><TrendingDown className="h-4 w-4" /> Parts COGS</span>
              <span className="text-[10px] bg-orange-200/60 px-1.5 py-0.2 rounded font-bold">Vendor Cost</span>
            </div>
            <div className="text-2xl font-black text-orange-950">${(pnL?.partsCOGS || 0).toFixed(2)}</div>
            <p className="text-[11px] text-orange-600/80 mt-1">Purchase cost of parts sold</p>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <div className="flex items-center justify-between text-emerald-700 font-semibold text-xs mb-1">
              <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Parts Profit</span>
              <span className="text-[10px] bg-emerald-200/60 px-1.5 py-0.2 rounded font-bold">Net Markup</span>
            </div>
            <div className="text-2xl font-black text-emerald-950">${(pnL?.partsGrossProfit || 0).toFixed(2)}</div>
            <p className="text-[11px] text-emerald-600/80 mt-1">Parts sold minus parts cost</p>
          </div>
        </div>

        {/* Secondary Bottom Line Metrics */}
        <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/40">
          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 mb-1">Total Gross Profit</div>
            <div className="text-2xl font-black text-slate-900">${(pnL?.totalGrossProfit || 0).toFixed(2)}</div>
            <p className="text-[11px] text-slate-400 mt-1">Labor ($_{(pnL?.laborRevenue || 0).toFixed(2)}) + Parts Profit ($_{(pnL?.partsGrossProfit || 0).toFixed(2)})</p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <div className="text-xs font-semibold text-rose-600 mb-1">Operating Expenses</div>
            <div className="text-2xl font-black text-rose-900">${(pnL?.totalExpenses || 0).toFixed(2)}</div>
            <p className="text-[11px] text-slate-400 mt-1">Shop supplies, fuel, rent, utilities</p>
          </div>

          <div className="p-4 bg-emerald-500 text-white rounded-xl shadow-sm">
            <div className="text-xs font-semibold text-emerald-100 mb-1">Net Operating Profit</div>
            <div className="text-3xl font-black">${(pnL?.netProfit || 0).toFixed(2)}</div>
            <p className="text-[11px] text-emerald-100 mt-1">Gross profit minus operating expenses</p>
          </div>
        </div>

        {/* Formula Explainer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
          <span>
            💡 <strong>Accurate Breakdown:</strong> Labor carries 0% inventory cost (100% margin). Parts calculate profit dynamically by subtracting vendor purchase cost from billed customer price.
          </span>
          <span className="text-[11px] text-slate-500">
            Cash Collected: ${(pnL?.totalRevenue || 0).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Accounts Receivable */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-500" /> Accounts Receivable
            </h2>
            <span className="text-sm font-bold text-slate-700">Who owes you</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {arAp?.accountsReceivable?.length === 0 && <div className="p-6 text-center text-slate-500 text-sm">No outstanding customer balances.</div>}
            {arAp?.accountsReceivable?.map((c: any) => {
              const totalOwed = c.invoices.reduce((sum: number, inv: any) => sum + Number(inv.balance), 0);
              return (
                <div key={c.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div className="font-medium text-slate-900">{c.companyName}</div>
                  <div className="font-bold text-red-600">${totalOwed.toFixed(2)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Accounts Payable */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-500" /> Accounts Payable
            </h2>
            <span className="text-sm font-bold text-slate-700">Who you owe</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {arAp?.accountsPayable?.length === 0 && <div className="p-6 text-center text-slate-500 text-sm">No outstanding vendor balances.</div>}
            {arAp?.accountsPayable?.map((v: any) => (
              <div key={v.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="font-medium text-slate-900">{v.name}</div>
                <div className="font-bold text-red-600">${Number(v.balance).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
