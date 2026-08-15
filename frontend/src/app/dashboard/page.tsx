"use client";

import { LayoutDashboard, TrendingUp, Users, Truck, FileText } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
          Dashboard
        </h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">Welcome back to Hussain Invoice. Here is what is happening today.</p>
      </div>

      {/* Placeholder Content */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        {[
          { label: "Total Revenue", value: "$0.00", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Active Customers", value: "0", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Vehicles", value: "0", icon: Truck, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Unpaid Invoices", value: "0", icon: FileText, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center mb-3 md:mb-4 ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-xs md:text-sm font-medium text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="h-16 w-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
          <LayoutDashboard className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Dashboard Coming Soon</h3>
        <p className="text-slate-500 mt-2 max-w-md">
          The dashboard will be fully built out in a future phase once Invoices and Vehicles are complete, so we can show you real analytics!
        </p>
      </div>
    </div>
  );
}
