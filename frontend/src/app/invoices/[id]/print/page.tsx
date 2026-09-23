"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, AlertCircle, Info } from "lucide-react";
import { API_URL } from "@/lib/config";
import InvoicePrintSheet from "@/app/components/InvoicePrintSheet";

export default function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/invoices/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Invoice not found");
          throw new Error("Failed to load invoice");
        }
        const data = await res.json();
        setInvoice(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500 font-mono text-sm">
        Preparing official invoice document...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md space-y-4">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Failed to Load Invoice</h2>
          <p className="text-xs text-slate-500">{error || "Could not retrieve invoice."}</p>
          <Link
            href={`/invoices/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoice Details
          </Link>
        </div>
      </div>
    );
  }

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/i/${invoice.id}` : undefined;

  return (
    <div className="min-h-screen bg-slate-200/70 py-6 md:py-10 px-2 md:px-6 print:bg-white print:p-0 print:m-0">
      
      {/* Floating Control Bar for Screen Only */}
      <div className="max-w-[850px] mx-auto mb-6 bg-white border border-slate-300 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={`/invoices/${id}`}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Details
          </Link>
          <div className="text-xs">
            <span className="font-bold text-slate-900 block">Print Preview: {invoice.invoiceNumber}</span>
            <span className="text-slate-500 text-[11px]">Formatted for US Letter & A4 paper</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>Enable <strong>Background graphics</strong> in print options</span>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* The Printable Sheet */}
      <InvoicePrintSheet invoice={invoice} publicUrl={publicUrl} />

    </div>
  );
}
