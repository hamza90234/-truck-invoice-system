"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  FileText, 
  Printer, 
  AlertCircle
} from "lucide-react";
import { API_URL } from "@/lib/config";
import InvoicePrintSheet from "@/app/components/InvoicePrintSheet";

export default function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPublicInvoice = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/invoices/public/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Invoice not found or link has expired");
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

    fetchPublicInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center text-slate-500 text-sm font-medium">
          Loading invoice...
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-md space-y-3">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Invoice Unavailable</h2>
          <p className="text-xs text-slate-500">{error || "The requested invoice could not be located."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 md:py-10 px-2 md:px-4 print:bg-white print:p-0 print:m-0">
      <div className="max-w-[850px] mx-auto space-y-6">
        
        {/* Top Floating Bar for Customer (Hidden on Print) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Commercial Repair Invoice</span>
              <span className="text-sm font-bold font-mono text-slate-900">{invoice.invoiceNumber}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print / Save Receipt
          </button>
        </div>

        {/* Ultra-Professional Printable Invoice Sheet */}
        <InvoicePrintSheet 
          invoice={invoice} 
          publicUrl={typeof window !== "undefined" ? window.location.href : undefined} 
        />

      </div>
    </div>
  );
}
