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
  ExternalLink,
  Mail,
  TrendingUp
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { apiFetch } from "@/lib/api";
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

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePaymentMethod, setSharePaymentMethod] = useState("CASH_CHECK");
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);

  // Email State
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API_URL}/api/invoices/${id}`);
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

  const handleNativeShare = async (method: string) => {
    const publicUrl = `${window.location.origin}/i/${id}`;
    const message = `Here is your invoice ${invoice.invoiceNumber} from ${invoice.shopProfile?.shopName || 'our shop'}: ${publicUrl}`;
    
    if (method === "SMS") {
      window.open(`sms:?&body=${encodeURIComponent(message)}`, '_blank');
    } else if (method === "EMAIL") {
      const subject = `Invoice ${invoice.invoiceNumber} - ${invoice.shopProfile?.shopName || 'AJ Truck Repair'}`;
      const emails: string[] = [];
      if (invoice.customer?.email) emails.push(invoice.customer.email.trim());
      if (invoice.customer?.additionalEmails) {
        emails.push(...invoice.customer.additionalEmails.split(",").map((s: string) => s.trim()).filter(Boolean));
      }
      const recipientStr = Array.from(new Set(emails)).join(",");
      window.open(`mailto:${encodeURIComponent(recipientStr)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, '_blank');
    } else {
      // Native Share API if supported
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Invoice ${invoice.invoiceNumber}`,
            text: message,
            url: publicUrl
          });
        } catch (err) {
          console.log("Share failed", err);
        }
      } else {
        handleCopyPublicLink();
      }
    }
  };

  const handleUpdateFeeAndShare = async (method: string) => {
    setIsUpdatingFee(true);
    try {
      let feeAmount = 0;
      const sub = Number(invoice.subtotal || 0);
      const tax = Number(invoice.taxAmount || 0);
      if (sharePaymentMethod === "CREDIT_CARD") {
        feeAmount = Number(((sub + tax) * 0.03).toFixed(2));
      }
      
      const currentFee = Number(invoice.creditCardFee || 0);
      // If fee hasn't changed, share immediately without unnecessary PUT request
      if (Math.abs(feeAmount - currentFee) < 0.01) {
        handleNativeShare(method);
        return;
      }

      // Calculate effective tax rate from parts subtotal to ensure tax is NEVER wiped
      const partsSub = invoice.items
        ?.filter((i: any) => i.type === "PART")
        ?.reduce((sum: number, i: any) => sum + (Number(i.quantity || 1) * Number(i.rate || 0)), 0) || 0;
      
      let effectiveTaxRate = 8.25;
      if (partsSub > 0 && tax > 0) {
        effectiveTaxRate = Number(((tax / partsSub) * 100).toFixed(4));
      } else if (tax > 0 && sub > 0) {
        effectiveTaxRate = Number(((tax / sub) * 100).toFixed(4));
      }
      
      const payload = {
        customerId: invoice.customerId,
        vehicleId: invoice.vehicleId,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        dueDate: invoice.dueDate,
        paymentTerms: invoice.paymentTerms,
        vehicleOdometer: invoice.vehicleOdometer,
        taxRate: effectiveTaxRate,
        creditCardFee: feeAmount,
        status: invoice.status,
        notes: invoice.notes,
        warrantyInfo: invoice.warrantyInfo,
        items: invoice.items.map((i: any) => ({
          type: i.type,
          partId: i.partId,
          description: i.description,
          quantity: Number(i.quantity),
          rate: Number(i.rate)
        }))
      };

      const res = await apiFetch(`${API_URL}/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to update fee");
      await fetchInvoice();
      
      handleNativeShare(method);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdatingFee(false);
    }
  };

  const handleCloseInvoice = async () => {
    if (!window.confirm("Lock and close this invoice? Once closed, items cannot be edited without manager override.")) {
      return;
    }
    try {
      const res = await apiFetch(`${API_URL}/api/invoices/${id}/close`, { method: "POST" });
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
      const res = await apiFetch(`${API_URL}/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete invoice");
      router.push("/invoices");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEmailInvoice = async () => {
    const emails: string[] = [];
    if (invoice?.customer?.email) emails.push(invoice.customer.email.trim());
    if (invoice?.customer?.additionalEmails) {
      emails.push(...invoice.customer.additionalEmails.split(",").map((s: string) => s.trim()).filter(Boolean));
    }
    const uniqueEmails = Array.from(new Set(emails));

    if (uniqueEmails.length === 0) {
      alert("This customer does not have an email address on file.");
      return;
    }
    
    if (!window.confirm(`Send this invoice to:\n${uniqueEmails.join("\n")}?`)) {
      return;
    }

    setSendingEmail(true);
    try {
      const res = await apiFetch(`${API_URL}/api/invoices/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: uniqueEmails.join(", ")
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send email");
      }
      
      alert(`Invoice emailed successfully to ${uniqueEmails.length} recipient(s)!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingEmail(false);
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
      const res = await apiFetch(`${API_URL}/api/invoices/${id}/payments`, {
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

  const getStatusBadge = (status: string, isEstimate?: boolean) => {
    if (isEstimate) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">ESTIMATE</span>;
    }
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
              {getStatusBadge(invoice.status, invoice.isEstimate)}
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

          <button
            type="button"
            onClick={handleEmailInvoice}
            disabled={sendingEmail}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Mail className="h-4 w-4" />
            {sendingEmail ? "Sending..." : "Email Invoice"}
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

          {/* Share Link Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Send / Share
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

      {/* Quick P&L & Public Link Helper Banner (Admin Only, Hidden on Print) */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6 print:hidden space-y-3">
        {invoice.profitBreakdown && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Invoice Net Profit</span>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    {invoice.profitBreakdown.profitMarginPct}% Gross Margin
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  ${Number(invoice.profitBreakdown.totalProfit || 0).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 text-xs border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6 flex-wrap">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Labor Profit (100%)</span>
                <span className="font-bold text-blue-600 font-mono text-base">
                  ${Number(invoice.profitBreakdown.laborRevenue || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Parts Profit (Markup)</span>
                <span className="font-bold text-emerald-600 font-mono text-base">
                  +${Number(invoice.profitBreakdown.partsProfit || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Parts Cost (COGS)</span>
                <span className="font-bold text-orange-600 font-mono text-base">
                  ${Number(invoice.profitBreakdown.partsCostTotal || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Public Customer Link Bar with 1-Click Copy */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-blue-900 shrink-0">🌐 Public Customer Link:</span>
            <span className="text-blue-700 font-mono truncate text-[11px] sm:text-xs">
              {typeof window !== "undefined" ? `${window.location.origin}/i/${invoice.id}` : `/i/${invoice.id}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer text-xs"
          >
            {copiedLink ? "✓ Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      {/* Main Printable Invoice Sheet */}
      <div className="p-4 md:p-8 print:p-0">
        <InvoicePrintSheet 
          invoice={invoice} 
          publicUrl={typeof window !== "undefined" ? `${window.location.origin}/i/${invoice.id}` : undefined} 
        />
      </div>

      {/* Internal Shop Profit & Loss Breakdown (Admin Only, Hidden on Print) */}
      {invoice.profitBreakdown && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 pb-8 print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Internal Profit & Margin Breakdown
                  </h3>
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Shop Admin Only
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Itemized profitability breakdown for this invoice (labor earnings + parts markup)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Gross Margin</span>
                  <span className="text-lg font-black text-emerald-600">
                    {invoice.profitBreakdown.profitMarginPct}%
                  </span>
                </div>
                <div className="text-right pl-4 border-l border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Profit</span>
                  <span className="text-xl font-black text-emerald-700">
                    ${Number(invoice.profitBreakdown.totalProfit || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Labor Earnings */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-800">Labor Earnings</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-200/60 text-blue-900">100% Margin</span>
                </div>
                <div className="text-xl font-black text-blue-950">
                  ${Number(invoice.profitBreakdown.laborRevenue || 0).toFixed(2)}
                </div>
                <span className="text-[11px] text-blue-600/90 mt-1 block">
                  Service & road calls
                </span>
              </div>

              {/* Parts Sold */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">Parts Sold (Billed)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-800">Revenue</span>
                </div>
                <div className="text-xl font-black text-slate-900">
                  ${Number(invoice.profitBreakdown.partsRevenue || 0).toFixed(2)}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Customer billed parts
                </span>
              </div>

              {/* Parts Cost (COGS) */}
              <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-orange-800">Parts Cost (COGS)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-200/60 text-orange-900">Vendor Cost</span>
                </div>
                <div className="text-xl font-black text-orange-950">
                  ${Number(invoice.profitBreakdown.partsCostTotal || 0).toFixed(2)}
                </div>
                <span className="text-[11px] text-orange-600/90 mt-1 block">
                  Acquisition cost
                </span>
              </div>

              {/* Parts Markup / Profit */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-800">Parts Profit</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-900">Net Markup</span>
                </div>
                <div className="text-xl font-black text-emerald-950">
                  ${Number(invoice.profitBreakdown.partsProfit || 0).toFixed(2)}
                </div>
                <span className="text-[11px] text-emerald-600/90 mt-1 block">
                  Billed minus parts cost
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
              <span className="font-medium">
                💡 Formula: Total Profit (${Number(invoice.profitBreakdown.totalProfit || 0).toFixed(2)}) = Labor (${Number(invoice.profitBreakdown.laborRevenue || 0).toFixed(2)}) + Parts Profit (${Number(invoice.profitBreakdown.partsProfit || 0).toFixed(2)})
              </span>
              <span className="text-[11px] text-slate-400">
                Calculated from vendor part unit costs & invoice items
              </span>
            </div>
          </div>
        </div>
      )}

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

      {/* Share / Send Invoice Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="h-4 w-4 text-blue-600" />
                Send Invoice to Customer
              </h3>
              <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              
              {/* Payment Method Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">How is the customer paying?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setSharePaymentMethod("CASH_CHECK")}
                    className={`p-3 text-center border-2 rounded-xl text-xs font-bold transition-all ${sharePaymentMethod === "CASH_CHECK" ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  >
                    Cash / Check / ACH
                    <span className="block text-[10px] font-medium text-slate-400 mt-1">No Extra Fees</span>
                  </button>
                  <button 
                    onClick={() => setSharePaymentMethod("CREDIT_CARD")}
                    className={`p-3 text-center border-2 rounded-xl text-xs font-bold transition-all ${sharePaymentMethod === "CREDIT_CARD" ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                  >
                    Credit Card
                    <span className="block text-[10px] font-medium text-slate-400 mt-1">+3% Processing Fee</span>
                  </button>
                </div>
              </div>

              {/* Share Options */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Send via...</label>
                
                <button
                  onClick={() => handleUpdateFeeAndShare("SMS")}
                  disabled={isUpdatingFee}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isUpdatingFee ? "Updating..." : "Send Text Message (SMS)"}
                </button>
                
                <button
                  onClick={() => handleUpdateFeeAndShare("EMAIL")}
                  disabled={isUpdatingFee}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  {isUpdatingFee ? "Updating..." : "Send Email to Customer"}
                </button>

                {/* Recipient Emails Preview */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                  <span className="font-bold text-slate-700 block">Recipient Emails on File:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {invoice.customer?.email && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-mono text-[11px] font-bold">
                        {invoice.customer.email} (Primary)
                      </span>
                    )}
                    {invoice.customer?.additionalEmails && invoice.customer.additionalEmails.split(",").map((em: string, idx: number) => {
                      const clean = em.trim();
                      if (!clean) return null;
                      return (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-mono text-[11px] font-bold">
                          {clean} (Dispatch / AP)
                        </span>
                      );
                    })}
                    {!invoice.customer?.email && !invoice.customer?.additionalEmails && (
                      <span className="text-slate-400 italic">No email on file. Add one in Customer Details.</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateFeeAndShare("NATIVE")}
                    disabled={isUpdatingFee}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 text-xs"
                  >
                    {isUpdatingFee ? "Updating..." : "More Options..."}
                  </button>
                  
                  <button
                    onClick={handleCopyPublicLink}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl transition-colors text-xs"
                  >
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
