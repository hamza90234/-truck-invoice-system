"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Printer, 
  Share2, 
  Pencil, 
  Lock, 
  Trash2, 
  CheckCircle2, 
  DollarSign, 
  Check, 
  X,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { API_URL } from "@/lib/config";
import InvoicePrintSheet from "@/app/components/InvoicePrintSheet";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactionRef, setTransactionRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

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
      setPaymentAmount(Number(data.balance || 0) > 0 ? Number(data.balance).toFixed(2) : "");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}/i/${id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCloseInvoice = async () => {
    if (!window.confirm("Lock and close this invoice? Once closed, items cannot be edited without manager override.")) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/invoices/${id}/close`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to close invoice");
      fetchInvoice();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!window.confirm("Are you sure you want to delete this invoice? Parts deducted from inventory will be returned to stock.")) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete invoice");
      router.push("/invoices");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      setPaymentError("Please enter a valid payment amount greater than 0");
      return;
    }

    setSubmittingPayment(true);
    setPaymentError("");

    try {
      const res = await fetch(`${API_URL}/api/invoices/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          paymentMethod,
          date: paymentDate,
          transactionId: transactionRef.trim() || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record payment");
      }

      setShowPaymentModal(false);
      fetchInvoice();
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">PAID</span>;
      case "PARTIALLY_PAID":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">PARTIALLY PAID</span>;
      case "UNPAID":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">UNPAID</span>;
      case "CLOSED":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">CLOSED</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">{status || "DRAFT"}</span>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-slate-400 text-sm">
        Loading invoice details...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm inline-block">
          {error || "Invoice not found"}
        </div>
        <div>
          <Link href="/invoices" className="text-blue-600 hover:underline text-xs font-semibold">
            &larr; Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12 bg-slate-100 min-h-screen print:bg-white print:pb-0">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="text-slate-500 hover:text-slate-900 p-1 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-slate-900 font-mono">{invoice.invoiceNumber}</h1>
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Print / PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>

          {/* Standalone Print Sheet View */}
          <Link
            href={`/invoices/${id}/print`}
            target="_blank"
            title="Open print sheet in clean standalone tab"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            Print Preview
          </Link>

          {/* Copy Public Link */}
          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4 text-slate-600" />}
            {copiedLink ? "Link Copied!" : "Share Link"}
          </button>

          {/* Record Payment */}
          {invoice.status !== "CLOSED" && Number(invoice.balance) > 0 && (
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm"
            >
              <DollarSign className="h-4 w-4" />
              Receive Payment
            </button>
          )}

          {/* Edit Invoice */}
          {invoice.status !== "CLOSED" && (
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          )}

          {/* Close Invoice */}
          {invoice.status !== "CLOSED" && (
            <button
              type="button"
              onClick={handleCloseInvoice}
              title="Lock invoice"
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-semibold p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Lock className="h-4 w-4" />
            </button>
          )}

          {/* Delete Invoice */}
          {invoice.status !== "CLOSED" && (
            <button
              type="button"
              onClick={handleDeleteInvoice}
              title="Delete invoice"
              className="flex items-center gap-1 text-slate-400 hover:text-rose-600 text-xs font-semibold p-2 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Printable Invoice Sheet */}
      <div className="p-4 md:p-8 print:p-0">
        <InvoicePrintSheet 
          invoice={invoice} 
          publicUrl={typeof window !== "undefined" ? `${window.location.origin}/i/${invoice.id}` : undefined} 
        />
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Record Customer Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {paymentError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Amount ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Remaining Balance: <strong>${Number(invoice.balance).toFixed(2)}</strong>
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="CASH">Cash</option>
                  <option value="ZELLE">Zelle</option>
                  <option value="CHECK">Check</option>
                  <option value="ACH">ACH Transfer</option>
                  <option value="EFS_COMCHEK">EFS / Comchek</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Check # / Transaction Ref (Optional)</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. Check #4029 or Stripe ID"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submittingPayment ? "Recording..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
