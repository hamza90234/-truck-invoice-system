"use client";

import React from "react";
import { 
  Truck, 
  Wrench, 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  Calendar, 
  CreditCard,
  FileText,
  Clock
} from "lucide-react";

interface InvoicePrintSheetProps {
  invoice: any;
  publicUrl?: string;
  hideQrCode?: boolean;
}

export default function InvoicePrintSheet({ invoice, publicUrl, hideQrCode = false }: InvoicePrintSheetProps) {
  if (!invoice) return null;

  const shop = invoice.shopProfile || {};
  const customer = invoice.customer || {};
  const vehicle = invoice.vehicle || {};
  const items = invoice.items || [];
  const payments = invoice.payments || [];

  const laborItems = items.filter((item: any) => item.type === "LABOR");
  const partItems = items.filter((item: any) => item.type === "PART");

  const laborSubtotal = laborItems.reduce((acc: number, item: any) => acc + Number(item.total || 0), 0);
  const partsSubtotal = partItems.reduce((acc: number, item: any) => acc + Number(item.total || 0), 0);
  const totalAmount = Number(invoice.totalAmount || 0);
  const amountPaid = Number(invoice.amountPaid || 0);
  const balance = Number(invoice.balance ?? (totalAmount - amountPaid));
  const isPaid = balance <= 0 || invoice.status === "PAID";

  const qrImageUrl = publicUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(publicUrl)}&margin=4`
    : null;

  return (
    <div className="bg-white text-slate-900 w-full max-w-[850px] mx-auto p-6 md:p-10 font-sans shadow-md border border-slate-200/90 rounded-2xl print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none">
      
      {/* ====================================================
          1. HEADER & BRANDING SECTION
          ==================================================== */}
      <div className="border-b-2 border-slate-900 pb-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          
          {/* Left: Shop Identity & Legal Info */}
          <div className="flex items-start gap-4">
            {shop.logoUrl ? (
              <img 
                src={shop.logoUrl} 
                alt={shop.shopName || "Shop Logo"} 
                className="h-16 w-16 object-contain rounded-lg border border-slate-200 p-1" 
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-slate-950 text-white flex flex-col items-center justify-center shadow-sm shrink-0 border border-slate-800">
                <Truck className="h-7 w-7 text-blue-400" />
                <span className="text-[8px] font-mono tracking-widest text-slate-300 font-bold uppercase">FLEET</span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight uppercase">
                  {shop.shopName || "HUSSAIN TRUCK & FLEET SERVICE"}
                </h1>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Heavy-Duty Commercial Repair • Fleet Diagnostics • 24/7 Road Service
              </p>

              <div className="text-xs text-slate-600 space-y-0.5">
                {shop.address && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{shop.address}</span>
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px]">
                  {shop.phone && (
                    <span className="flex items-center gap-1 font-medium">
                      <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{shop.phone}</span>
                    </span>
                  )}
                  {shop.email && (
                    <span className="flex items-center gap-1 font-medium">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{shop.email}</span>
                    </span>
                  )}
                  {shop.website && (
                    <span className="flex items-center gap-1 font-medium">
                      <Globe className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{shop.website}</span>
                    </span>
                  )}
                  {shop.taxId && (
                    <span className="text-slate-500">
                      <strong>Tax ID / EIN:</strong> {shop.taxId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Invoice Label, Number & Status */}
          <div className="text-left sm:text-right shrink-0 w-full sm:w-auto relative">
            <div className="inline-block bg-slate-900 text-white text-[11px] font-mono uppercase font-black tracking-widest px-3 py-1 rounded">
              COMMERCIAL REPAIR INVOICE
            </div>
            
            <div className="text-2xl md:text-3xl font-black font-mono tracking-tight text-slate-950 mt-1">
              {invoice.invoiceNumber || "INV-0000"}
            </div>

            {/* Official Status Stamp / Badge */}
            <div className="mt-2 flex sm:justify-end">
              {isPaid ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border-2 border-emerald-600 rounded-md font-black text-xs uppercase tracking-wider shadow-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>PAID IN FULL</span>
                </div>
              ) : invoice.status === "PARTIALLY_PAID" ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border-2 border-amber-500 rounded-md font-black text-xs uppercase tracking-wider shadow-xs">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>PARTIAL PAYMENT</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border-2 border-rose-500 rounded-md font-black text-xs uppercase tracking-wider shadow-xs">
                  <span>PAYMENT DUE</span>
                </div>
              )}
            </div>

            {/* Date and Terms Grid */}
            <div className="text-xs text-slate-600 mt-3 space-y-0.5">
              <div className="flex sm:justify-end gap-2">
                <span className="text-slate-500">Invoice Date:</span>
                <span className="font-bold text-slate-900">
                  {invoice.date ? new Date(invoice.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                </span>
              </div>
              {invoice.dueDate && (
                <div className="flex sm:justify-end gap-2">
                  <span className="text-slate-500">Payment Due:</span>
                  <span className="font-bold text-rose-700">
                    {new Date(invoice.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
              {invoice.paymentTerms && (
                <div className="flex sm:justify-end gap-2">
                  <span className="text-slate-500">Terms:</span>
                  <span className="font-semibold text-slate-900">{invoice.paymentTerms}</span>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ====================================================
          2. FLEET CUSTOMER & VEHICLE EQUIPMENT DUAL CARDS
          ==================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print-avoid-break">
        
        {/* Card 1: Bill To / Fleet Customer */}
        <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/50 print:bg-transparent">
          <div className="bg-slate-800 text-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>BILL TO / FLEET CUSTOMER</span>
            {customer.customerType && (
              <span className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded text-[9px]">
                {customer.customerType}
              </span>
            )}
          </div>
          <div className="p-3.5 text-xs text-slate-700 space-y-1">
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-tight">
              {customer.companyName || "Cash / Direct Customer"}
            </h2>
            {customer.contactPerson && (
              <p className="text-slate-600">
                <span className="text-slate-400 font-medium">Attn:</span> {customer.contactPerson}
              </p>
            )}
            {customer.billingAddress && (
              <p className="text-slate-600 leading-tight">
                {customer.billingAddress}
              </p>
            )}
            <div className="pt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-600">
              {customer.phone && (
                <p><strong>Tel:</strong> {customer.phone}</p>
              )}
              {customer.email && (
                <p><strong>Email:</strong> {customer.email}</p>
              )}
            </div>
            {(customer.usdot || customer.mcNumber) && (
              <div className="pt-1 flex gap-3 text-[10px] font-mono text-slate-500">
                {customer.usdot && <span>USDOT: {customer.usdot}</span>}
                {customer.mcNumber && <span>MC#: {customer.mcNumber}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Vehicle & Unit Information */}
        <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/50 print:bg-transparent">
          <div className="bg-slate-800 text-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>UNIT & EQUIPMENT INFORMATION</span>
            <span className="text-[10px] text-blue-300 font-mono font-bold">
              {vehicle.unitNumber ? `UNIT #${vehicle.unitNumber}` : "EQUIPMENT"}
            </span>
          </div>
          <div className="p-3.5 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-950">
                {vehicle.year || ""} {vehicle.make || ""} {vehicle.model || "Commercial Vehicle"}
              </span>
              {vehicle.unitNumber && (
                <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded text-[11px] font-bold font-mono">
                  UNIT #{vehicle.unitNumber}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px] font-mono">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">VIN</span>
                <span className="font-bold text-slate-900 tracking-wider">
                  {vehicle.vin || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">License Plate</span>
                <span className="font-bold text-slate-900">
                  {vehicle.licensePlate || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Odometer / Mileage</span>
                <span className="font-semibold text-slate-800">
                  {vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} mi` : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Engine / Drivetrain</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {vehicle.engine || "Heavy Diesel"}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ====================================================
          3. SERVICE SCOPE / DIAGNOSTIC COMPLAINT NOTES (IF ANY)
          ==================================================== */}
      {invoice.notes && (
        <div className="mb-6 p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-700 print:bg-transparent print-avoid-break">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-800 text-[10px] mb-1">
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            <span>Service Scope & Work Performed Description</span>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
            {invoice.notes}
          </p>
        </div>
      )}

      {/* ====================================================
          4. ITEMIZED LABOR & SERVICES TABLE
          ==================================================== */}
      {laborItems.length > 0 && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between pb-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-blue-600" />
              <span>Labor Operations & Diagnostics</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">
              {laborItems.length} {laborItems.length === 1 ? "operation" : "operations"}
            </span>
          </div>

          <table className="w-full text-left text-xs border border-slate-300 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-300">
              <tr>
                <th className="py-2 px-3 w-8 text-center text-slate-400">#</th>
                <th className="py-2 px-3">Service & Operation Description</th>
                <th className="py-2 px-3 text-right w-24">Hours</th>
                <th className="py-2 px-3 text-right w-28">Rate / Hr</th>
                <th className="py-2 px-3 text-right w-28">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {laborItems.map((item: any, idx: number) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-2 px-3 font-medium text-slate-900 leading-snug">{item.description}</td>
                  <td className="py-2 px-3 text-right text-slate-700 font-mono">{Number(item.quantity).toFixed(2)}</td>
                  <td className="py-2 px-3 text-right text-slate-700 font-mono">${Number(item.rate).toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-950 font-mono">${Number(item.total).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50/80 font-semibold border-t-2 border-slate-300 print:bg-transparent">
                <td colSpan={4} className="py-2 px-3 text-right text-slate-700 uppercase text-[10px] tracking-wider">
                  Labor Operations Subtotal:
                </td>
                <td className="py-2 px-3 text-right font-black text-slate-900 font-mono">
                  ${laborSubtotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ====================================================
          5. ITEMIZED PARTS & REPLACEMENT MATERIALS TABLE
          ==================================================== */}
      {partItems.length > 0 && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between pb-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-blue-600" />
              <span>Parts & Replacement Components</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">
              {partItems.length} {partItems.length === 1 ? "line item" : "line items"}
            </span>
          </div>

          <table className="w-full text-left text-xs border border-slate-300 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-300">
              <tr>
                <th className="py-2 px-3 w-32">Part # / SKU</th>
                <th className="py-2 px-3">Item Description & Specification</th>
                <th className="py-2 px-3 text-right w-20">Qty</th>
                <th className="py-2 px-3 text-right w-28">Unit Price</th>
                <th className="py-2 px-3 text-right w-28">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {partItems.map((item: any, idx: number) => {
                const partNumber = item.part?.partNumber || item.partNumber || "OEM-REQ";
                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-mono font-bold text-slate-800 text-[11px]">{partNumber}</td>
                    <td className="py-2 px-3 font-medium text-slate-900 leading-snug">{item.description}</td>
                    <td className="py-2 px-3 text-right text-slate-700 font-mono">{Number(item.quantity).toFixed(0)}</td>
                    <td className="py-2 px-3 text-right text-slate-700 font-mono">${Number(item.rate).toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-950 font-mono">${Number(item.total).toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50/80 font-semibold border-t-2 border-slate-300 print:bg-transparent">
                <td colSpan={4} className="py-2 px-3 text-right text-slate-700 uppercase text-[10px] tracking-wider">
                  Parts & Materials Subtotal:
                </td>
                <td className="py-2 px-3 text-right font-black text-slate-900 font-mono">
                  ${partsSubtotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ====================================================
          6. FINANCIAL SETTLEMENT, REMITTANCE & TOTALS GRID
          ==================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 mb-6 border-t border-slate-200 print-avoid-break">
        
        {/* Left Column: Remittance, QR Code & Warranty Terms (7 Cols) */}
        <div className="md:col-span-7 space-y-4 text-xs text-slate-600">
          
          {/* Remittance & Payment Instructions */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 print:bg-transparent">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-1.5 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-slate-700" />
              <span>Remittance & Payment Instructions</span>
            </h4>
            <div className="space-y-1 text-slate-600 leading-relaxed text-[11px]">
              <p>• Make checks payable to: <strong className="text-slate-900">{shop.shopName || "Hussain Truck Repair"}</strong></p>
              <p>• Reference Invoice <strong className="text-slate-900">{invoice.invoiceNumber}</strong> on all checks, ACH, or wire transfers.</p>
              <p>• Accepted Methods: Commercial Fleet Checks, EFS / Comchek, T-Chek, Major Cards, ACH Wire.</p>
            </div>

            {/* Public Link / QR Code for Scanning */}
            {qrImageUrl && !hideQrCode && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-3">
                <img 
                  src={qrImageUrl} 
                  alt="QR Code to Pay Online" 
                  className="h-16 w-16 rounded border border-slate-300 p-0.5 bg-white shrink-0" 
                />
                <div className="text-[10px] text-slate-500 leading-tight">
                  <span className="font-bold text-slate-800 block mb-0.5">Instant Mobile View & Pay:</span>
                  <span>Scan this QR code with any smartphone camera to inspect itemized details or pay online.</span>
                </div>
              </div>
            )}
          </div>

          {/* Warranty & Mechanic's Lien Disclaimer */}
          <div className="text-[10px] text-slate-500 leading-snug p-2.5 rounded-lg border border-slate-200 bg-slate-50/30 print:bg-transparent">
            <span className="font-bold text-slate-700 uppercase block mb-0.5">
              Standard Commercial Warranty & Mechanic's Lien Notice:
            </span>
            <p>
              {invoice.warrantyInfo || 
                "All labor performed is warranted for 30 days or 3,000 miles (whichever occurs first) under standard commercial highway operating conditions. Replacement parts carry strictly manufacturer warranties. Replaced parts are scrapped unless requested prior to work commencement. A possessory mechanic's lien is retained on this equipment under applicable state law to secure full settlement of all authorized repairs, diagnostics, parts, storage, and towing."
              }
            </p>
          </div>

        </div>

        {/* Right Column: Financial Ledger Breakdown (5 Cols) */}
        <div className="md:col-span-5">
          <div className="border-2 border-slate-900 rounded-xl overflow-hidden p-4 bg-slate-50/50 print:bg-transparent space-y-2.5 text-xs">
            
            <div className="flex justify-between text-slate-600">
              <span>Labor Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">${laborSubtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Parts & Materials:</span>
              <span className="font-mono font-semibold text-slate-900">${partsSubtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
              <span className="font-medium">Subtotal (Pre-Tax):</span>
              <span className="font-mono font-bold text-slate-950">${Number(invoice.subtotal || (laborSubtotal + partsSubtotal)).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Sales Tax:</span>
              <span className="font-mono font-semibold text-slate-900">${Number(invoice.taxAmount || 0).toFixed(2)}</span>
            </div>

            {Number(invoice.creditCardFee || 0) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Credit Card Processing Fee:</span>
                <span className="font-mono font-semibold text-slate-900">${Number(invoice.creditCardFee).toFixed(2)}</span>
              </div>
            )}

            {/* Total Amount Due */}
            <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900 text-sm">
              <span className="font-black uppercase tracking-tight text-slate-950">Total Invoice:</span>
              <span className="font-mono font-black text-slate-950 text-base">
                ${totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Payments / Credits */}
            <div className="flex justify-between text-slate-600 pt-1">
              <span>Payments & Credits:</span>
              <span className="font-mono font-bold text-emerald-700">
                -${amountPaid.toFixed(2)}
              </span>
            </div>

            {/* Net Balance Due Box */}
            <div className={`p-3 rounded-lg border-2 mt-2 flex justify-between items-center ${
              isPaid 
                ? "bg-emerald-50 border-emerald-600 text-emerald-900" 
                : "bg-slate-900 border-slate-950 text-white"
            }`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  {isPaid ? "Status" : "Total Balance Due"}
                </span>
                <span className="text-lg md:text-xl font-black font-mono tracking-tight">
                  {isPaid ? "$0.00" : `$${balance.toFixed(2)}`}
                </span>
              </div>
              <div>
                {isPaid ? (
                  <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-xs">
                    PAID
                  </span>
                ) : (
                  <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    DUE
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ====================================================
          7. RECORDED PAYMENTS AUDIT TABLE (IF ANY)
          ==================================================== */}
      {payments && payments.length > 0 && (
        <div className="mb-6 pt-2 border-t border-slate-200 print-avoid-break">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Applied Payment & Settlement Transactions</span>
          </h4>
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px] border-b border-slate-200">
              <tr>
                <th className="py-1.5 px-3">Date</th>
                <th className="py-1.5 px-3">Payment Method</th>
                <th className="py-1.5 px-3">Reference / Check #</th>
                <th className="py-1.5 px-3 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="py-1.5 px-3 text-slate-600">
                    {new Date(p.date).toLocaleDateString()}
                  </td>
                  <td className="py-1.5 px-3 font-semibold text-slate-800">
                    {p.paymentMethod?.replace("_", " ")}
                  </td>
                  <td className="py-1.5 px-3 font-mono text-slate-500">
                    {p.transactionId || "—"}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">
                    +${Number(p.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ====================================================
          8. DUAL SIGNATURE ACCEPTANCE & AUTHORIZATION BLOCK
          ==================================================== */}
      <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-8 print-avoid-break">
        
        {/* Service Advisor / Technician Signature */}
        <div>
          <div className="h-10 border-b border-slate-400 mb-1 flex items-end">
            <span className="text-[9px] text-slate-400 italic font-mono">Service Authorized & Completed</span>
          </div>
          <div className="flex justify-between items-baseline text-slate-600 text-[11px]">
            <span className="font-bold text-slate-800 uppercase text-[10px]">
              Shop Technician / Service Advisor
            </span>
            <span>Date: ____/____/________</span>
          </div>
        </div>

        {/* Customer / Fleet Acceptance Signature */}
        <div>
          <div className="h-10 border-b border-slate-400 mb-1 flex items-end">
            <span className="text-[9px] text-slate-400 italic font-mono">Equipment Received in Satisfactory Order</span>
          </div>
          <div className="flex justify-between items-baseline text-slate-600 text-[11px]">
            <span className="font-bold text-slate-800 uppercase text-[10px]">
              Authorized Customer / Fleet Driver
            </span>
            <span>Date: ____/____/________</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
            I hereby certify that I have inspected the completed work and accept vehicle in good operating condition.
          </p>
        </div>

      </div>

      {/* ====================================================
          9. OFFICIAL FOOTER NOTE
          ==================================================== */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2 print:mt-6">
        <span>Commercial Heavy Truck Fleet Management System</span>
        <span className="font-medium text-slate-500">Thank you for your business! Safe miles ahead.</span>
        <span>Page 1 of 1</span>
      </div>

    </div>
  );
}
