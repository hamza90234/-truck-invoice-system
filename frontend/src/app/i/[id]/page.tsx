"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  FileText, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Truck, 
  Wrench, 
  Package, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { API_URL } from "@/lib/config";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">PAID IN FULL</span>;
      case "PARTIALLY_PAID":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">PARTIALLY PAID</span>;
      case "CLOSED":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-300">CLOSED / COMPLETED</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">PAYMENT DUE</span>;
    }
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

  const laborItems = invoice.items?.filter((i: any) => i.type === "LABOR") || [];
  const partItems = invoice.items?.filter((i: any) => i.type === "PART") || [];
  const shop = invoice.shopProfile || {};
  const isPaid = Number(invoice.balance) <= 0;

  return (
    <div className="min-h-screen bg-slate-100 py-6 md:py-12 px-4 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Floating Bar for Customer (Hidden on Print) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">Invoice {invoice.invoiceNumber}</span>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save Receipt
          </button>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-10 space-y-8 print:p-0 print:border-none print:shadow-none">
          
          {/* Shop Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {shop.shopName || "Truck Repair & Service"}
              </h1>
              <div className="text-xs text-slate-600 space-y-0.5 mt-2">
                {shop.address && <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {shop.address}</p>}
                {shop.phone && <p className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" /> {shop.phone}</p>}
                {shop.email && <p className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400" /> {shop.email}</p>}
                {shop.website && <p className="flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-slate-400" /> {shop.website}</p>}
              </div>
            </div>

            <div className="sm:text-right w-full sm:w-auto">
              <div className="mb-2">
                {getStatusBadge(invoice.status)}
              </div>
              <div className="text-lg font-bold font-mono text-slate-900">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                <p>Date: {new Date(invoice.date).toLocaleDateString()}</p>
                {invoice.paymentTerms && <p>Terms: {invoice.paymentTerms}</p>}
                {invoice.dueDate && <p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>}
              </div>
            </div>
          </div>

          {/* Customer & Vehicle Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 print:bg-transparent print:border print:border-slate-300">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Customer Information
              </span>
              <h2 className="text-sm font-bold text-slate-900">{invoice.customer?.companyName}</h2>
              <div className="text-xs text-slate-600 space-y-0.5 mt-1">
                {invoice.customer?.contactPerson && <p>Contact: {invoice.customer.contactPerson}</p>}
                {invoice.customer?.phone && <p>Phone: {invoice.customer.phone}</p>}
                {invoice.customer?.email && <p>Email: {invoice.customer.email}</p>}
                {invoice.customer?.billingAddress && <p>{invoice.customer.billingAddress}</p>}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Serviced Vehicle
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                Unit #{invoice.vehicle?.unitNumber || "N/A"}
              </h2>
              <div className="text-xs text-slate-600 space-y-0.5 mt-1 font-mono">
                <p>
                  {invoice.vehicle?.year || ""} {invoice.vehicle?.make || ""} {invoice.vehicle?.model || ""}
                </p>
                <p>VIN: {invoice.vehicle?.vin}</p>
                {invoice.vehicle?.licensePlate && <p>Plate: {invoice.vehicle.licensePlate}</p>}
                {invoice.vehicle?.mileage && <p>Odometer: {Number(invoice.vehicle.mileage).toLocaleString()} mi</p>}
              </div>
            </div>
          </div>

          {/* Labor Breakdown */}
          {laborItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Wrench className="h-4 w-4 text-blue-600" />
                Services & Diagnostics Performed
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden print:border-slate-300">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Service Description</th>
                      <th className="py-2.5 px-3 text-right w-20">Hours</th>
                      <th className="py-2.5 px-3 text-right w-24">Rate</th>
                      <th className="py-2.5 px-3 text-right w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {laborItems.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 text-slate-900 font-medium">{item.description}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{Number(item.quantity).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">${Number(item.rate).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">${Number(item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parts Breakdown */}
          {partItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Package className="h-4 w-4 text-blue-600" />
                Installed Parts & Materials
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden print:border-slate-300">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Part Description</th>
                      <th className="py-2.5 px-3 text-right w-20">Qty</th>
                      <th className="py-2.5 px-3 text-right w-24">Price</th>
                      <th className="py-2.5 px-3 text-right w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partItems.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 text-slate-900 font-medium">{item.description}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{Number(item.quantity).toFixed(0)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">${Number(item.rate).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">${Number(item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals Breakdown */}
          <div className="border-t border-slate-200 pt-6 flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">${Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax:</span>
                <span className="font-semibold text-slate-800">${Number(invoice.taxAmount).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span>${Number(invoice.totalAmount).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600 pt-1">
                <span>Amount Paid:</span>
                <span className="font-semibold text-emerald-600">-${Number(invoice.amountPaid).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t-2 border-slate-900">
                <span>Balance Due:</span>
                <span className={Number(invoice.balance) > 0 ? "text-rose-600" : "text-emerald-600"}>
                  ${Number(invoice.balance).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="border-t border-slate-200 pt-6 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Payment Confirmation History
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.payments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 text-slate-600">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{p.paymentMethod}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600">+${Number(p.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warranty & Footer */}
          <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500 space-y-2">
            {invoice.warrantyInfo && (
              <p className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 inline-block text-slate-600 max-w-lg">
                <ShieldCheck className="h-4 w-4 text-blue-600 inline-block mr-1 -mt-0.5" />
                {invoice.warrantyInfo}
              </p>
            )}
            <p>Thank you for choosing {shop.shopName || "our repair shop"}!</p>
          </div>

        </div>
      </div>
    </div>
  );
}
