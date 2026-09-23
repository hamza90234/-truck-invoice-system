"use client";

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
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports/profit-loss`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports/ar-ap`)
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
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Financial Reports
        </h1>
        <p className="text-slate-500 mt-1">Detailed breakdown of your business financials.</p>
      </div>

      {/* Profit & Loss Overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900">Profit & Loss Overview</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 font-semibold mb-1">
              <TrendingUp className="h-4 w-4" /> Total Revenue
            </div>
            <div className="text-2xl font-bold text-slate-900">${(pnL?.totalRevenue || 0).toFixed(2)}</div>
          </div>
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700 font-semibold mb-1">
              <TrendingDown className="h-4 w-4" /> Cost of Parts
            </div>
            <div className="text-2xl font-bold text-slate-900">${(pnL?.totalCOGS || 0).toFixed(2)}</div>
          </div>
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-1">
              <TrendingDown className="h-4 w-4" /> Operating Expenses
            </div>
            <div className="text-2xl font-bold text-slate-900">${(pnL?.totalExpenses || 0).toFixed(2)}</div>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
              <DollarSign className="h-4 w-4" /> Net Profit
            </div>
            <div className="text-3xl font-black text-green-700">${(pnL?.netProfit || 0).toFixed(2)}</div>
          </div>
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
