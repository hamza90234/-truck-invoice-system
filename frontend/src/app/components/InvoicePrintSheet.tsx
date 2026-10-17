"use client";

import React from "react";

interface InvoicePrintSheetProps {
  invoice: any;
  publicUrl?: string;
  hideQrCode?: boolean;
}

// Mask wholesale part number on customer-facing invoices (show only last 3 characters)
function maskPartNumber(pn?: string | null): string {
  if (!pn) return "";
  const clean = pn.trim();
  if (clean.length <= 3) return clean;
  const last3 = clean.slice(-3);
  return `•••-${last3}`;
}

function cleanPartDescription(desc: string, partNumber?: string | null): { maskedCode: string | null; text: string } {
  let text = desc || "";
  let rawCode = partNumber || "";

  // Check if description already starts with [PART_NUMBER]
  const match = text.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (match) {
    rawCode = match[1];
    text = match[2];
  }

  const maskedCode = rawCode ? maskPartNumber(rawCode) : null;
  return { maskedCode, text };
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
  const subtotal = laborSubtotal + partsSubtotal;
  const taxAmount = Number(invoice.taxAmount || 0);
  const totalAmount = Number(invoice.totalAmount || 0);
  const amountPaid = Number(invoice.amountPaid || 0);
  const balance = Number(invoice.balance ?? (totalAmount - amountPaid));
  const isPaid = balance <= 0 || invoice.status === "PAID";

  let paymentInstructions = `We accept Zelle, checks, ACH/wire transfers, and EFS/Comchek.

Zelle: 909-500-0909 — AJ Truck Repair and Mobile Road Service.

Please make checks payable to AJ Truck Repair and Mobile Road Service.

Billing Address:
AJ Truck Repair and Mobile Road Service
PO Box 51157
Riverside, CA 92517

Payment is due upon receipt. Vehicle will be released only after payment is received. Storage fees may apply. A mechanic’s lien may be filed in accordance with California law.`;

  if (shop.invoiceSettings) {
    try {
      const parsed = typeof shop.invoiceSettings === 'string' ? JSON.parse(shop.invoiceSettings) : shop.invoiceSettings;
      if (parsed.paymentInstructions) {
        paymentInstructions = parsed.paymentInstructions;
      }
    } catch (e) {
      // fallback
    }
  }

  const isTrailer = vehicle.equipmentType === "TRAILER" || !!vehicle.trailerType;

  return (
    <div className="bg-white text-slate-800 w-full max-w-4xl mx-auto p-4 sm:p-8 md:p-12 shadow-xs border border-slate-200 print:shadow-none print:border-none print:p-0">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6 mb-6 sm:pb-8 sm:mb-8">
        <div>
          {/* Shop Logo */}
          <div className="mb-3">
            <img 
              src={shop.logoUrl || "/logo.jpg"} 
              alt={shop.shopName || "AJ Road Service & Repair"} 
              className="h-16 sm:h-20 w-auto max-w-[260px] object-contain mb-2 print:max-h-20"
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight hidden">
              {shop.shopName || "AJ Road Service & Repair"}
            </h1>
          </div>
          <div className="text-sm text-slate-500 space-y-1">
            {shop.address && <p>{shop.address}</p>}
            {shop.phone && <p>{shop.phone}</p>}
            {shop.website && <p>{shop.website}</p>}
          </div>
        </div>

        <div className="text-left sm:text-right w-full sm:w-auto">
          <h2 className="text-3xl sm:text-4xl font-light text-slate-900 mb-4 uppercase tracking-widest">
            {invoice.isEstimate ? "Estimate" : "Invoice"}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-2 text-sm text-left sm:text-right sm:justify-end">
            <span className="text-slate-500 font-medium">{invoice.isEstimate ? "Estimate No:" : "Invoice No:"}</span>
            <span className="font-semibold text-slate-900">{invoice.invoiceNumber || "N/A"}</span>
            
            <span className="text-slate-500 font-medium">Date:</span>
            <span className="text-slate-900">
              {invoice.date ? new Date(invoice.date).toLocaleDateString() : "N/A"}
            </span>
            
            {invoice.dueDate && (
              <>
                <span className="text-slate-500 font-medium">Due Date:</span>
                <span className="text-slate-900">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </>
            )}
            
            <span className="text-slate-500 font-medium">Status:</span>
            <span className={`font-bold ${isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPaid ? "PAID" : invoice.status === "PARTIALLY_PAID" ? "PARTIALLY PAID" : "DUE"}
            </span>
          </div>
        </div>
      </div>

      {/* BILLING & VEHICLE INFO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 mb-8 sm:mb-10">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
            Bill To
          </h3>
          <div className="text-sm space-y-1">
            <p className="font-bold text-slate-900 text-base">{customer.companyName || customer.firstName + " " + customer.lastName}</p>
            {customer.contactPerson && <p className="text-slate-600">Attn: {customer.contactPerson}</p>}
            {customer.billingAddress && <p className="text-slate-600">{customer.billingAddress}</p>}
            {customer.phone && <p className="text-slate-600">{customer.phone}</p>}
            {customer.email && <p className="text-slate-600">{customer.email}</p>}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
            {isTrailer ? "Trailer Information" : "Vehicle Information"}
          </h3>
          <div className="text-sm space-y-1">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-bold text-slate-900 text-base">
                {vehicle.year ? `${vehicle.year} ` : ""}{vehicle.make || (isTrailer ? "Trailer" : "Truck")} {vehicle.model || ""}
              </span>
              {vehicle.unitNumber && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Unit #{vehicle.unitNumber}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 text-slate-600 text-xs">
              <p><span className="font-semibold text-slate-500 mr-1">VIN:</span> {vehicle.vin || "N/A"}</p>
              <p>
                <span className="font-semibold text-slate-500 mr-1">Plate:</span> 
                {vehicle.licensePlate ? (
                  <span className="font-semibold text-slate-900">
                    {vehicle.licensePlate} {vehicle.licensePlateState ? `(${vehicle.licensePlateState})` : "(CA)"}
                  </span>
                ) : "N/A"}
              </p>

              {isTrailer ? (
                <>
                  <p><span className="font-semibold text-slate-500 mr-1">Type:</span> {vehicle.trailerType || "Dry Van / Freight"}</p>
                  {vehicle.color && <p><span className="font-semibold text-slate-500 mr-1">Color:</span> {vehicle.color}</p>}
                </>
              ) : (
                <>
                  <p><span className="font-semibold text-slate-500 mr-1">Odometer:</span> {invoice.vehicleOdometer ? `${invoice.vehicleOdometer.toLocaleString()} mi` : (vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : "N/A")}</p>
                  {vehicle.color && <p><span className="font-semibold text-slate-500 mr-1">Color:</span> {vehicle.color}</p>}
                  {vehicle.engine && <p><span className="font-semibold text-slate-500 mr-1">Engine:</span> {vehicle.engine}</p>}
                  {vehicle.transmission && <p><span className="font-semibold text-slate-500 mr-1">Trans:</span> {vehicle.transmission}</p>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      {invoice.notes && (
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
            Service Description & Findings
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* LINE ITEMS */}
      <div className="mb-8 sm:mb-10 overflow-x-auto w-full">
        <table className="w-full text-sm text-left min-w-[500px]">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="py-3 font-semibold text-slate-900">Description</th>
              <th className="py-3 text-right font-semibold text-slate-900">Qty / Hrs</th>
              <th className="py-3 text-right font-semibold text-slate-900">Rate</th>
              <th className="py-3 text-right font-semibold text-slate-900">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {laborItems.length > 0 && (
              <tr>
                <td colSpan={4} className="py-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50 px-2 rounded">
                  Labor & Road Service (Tax-Exempt / 0.00% Tax)
                </td>
              </tr>
            )}
            {laborItems.map((item: any, idx: number) => (
              <tr key={item.id || idx}>
                <td className="py-3 px-2 text-slate-800">{item.description}</td>
                <td className="py-3 text-right text-slate-600">{Number(item.quantity).toFixed(2)}</td>
                <td className="py-3 text-right text-slate-600">${Number(item.rate).toFixed(2)}</td>
                <td className="py-3 text-right text-slate-900 font-medium">${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
            
            {partItems.length > 0 && (
              <tr>
                <td colSpan={4} className="py-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-50 px-2 rounded mt-3">
                  Parts & Materials (Taxable)
                </td>
              </tr>
            )}
            {partItems.map((item: any, idx: number) => {
              const { maskedCode, text } = cleanPartDescription(item.description, item.part?.partNumber || item.partNumber);
              return (
                <tr key={item.id || idx}>
                  <td className="py-3 px-2 text-slate-800">
                    {maskedCode && (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px] font-bold mr-2 border border-slate-200">
                        {maskedCode}
                      </span>
                    )}
                    <span>{text}</span>
                  </td>
                  <td className="py-3 text-right text-slate-600">{Number(item.quantity).toFixed(0)}</td>
                  <td className="py-3 text-right text-slate-600">${Number(item.rate).toFixed(2)}</td>
                  <td className="py-3 text-right text-slate-900 font-medium">${Number(item.total).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TOTALS */}
      <div className="flex justify-end mb-12">
        <div className="w-full max-w-sm space-y-3">
          <div className="flex justify-between text-sm text-slate-600 px-2">
            <span>Labor Subtotal (Tax-Exempt)</span>
            <span className="font-medium text-slate-900">${laborSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 px-2">
            <span>Parts Subtotal (Taxable)</span>
            <span className="font-medium text-slate-900">${partsSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 px-2">
            <span>Sales Tax (Parts Only)</span>
            <span className="font-medium text-slate-900">${taxAmount.toFixed(2)}</span>
          </div>
          {Number(invoice.creditCardFee || 0) > 0 && (
            <div className="flex justify-between text-sm text-slate-600 px-2">
              <span>Credit Card Fee</span>
              <span className="font-medium text-slate-900">${Number(invoice.creditCardFee).toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-lg font-bold text-slate-900 border-t-2 border-slate-900 pt-3 px-2 mt-3">
            <span>Total</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          
          {amountPaid > 0 && (
            <div className="flex justify-between text-sm text-slate-600 px-2">
              <span>Amount Paid</span>
              <span className="font-medium text-emerald-600">-${amountPaid.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-lg font-bold text-slate-900 bg-slate-100 p-3 rounded-lg mt-2">
            <span>Balance Due</span>
            <span className={balance <= 0 ? "text-emerald-600" : "text-rose-600"}>
              ${balance <= 0 ? "0.00" : balance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER & REMITTANCE */}
      <div className="border-t border-slate-200 pt-6 sm:pt-8 text-xs text-slate-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">Warranty & Terms</h4>
            <p className="leading-relaxed whitespace-pre-wrap">
              {invoice.warrantyInfo || "30-day labor and 90-day parts warranty from date of repair. Thank you for your business."}
            </p>
          </div>
          <div className="text-left md:text-right">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">Payment Instructions & Remittance</h4>
            <div className="leading-relaxed whitespace-pre-line text-slate-700 font-medium">
              {paymentInstructions}
            </div>
          </div>
        </div>
      </div>

      {/* SIGNATURES */}
      <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
        <div>
          <div className="border-b border-slate-400 h-10 mb-2"></div>
          <p className="text-xs text-slate-500">Authorized Signature</p>
        </div>
        <div>
          <div className="border-b border-slate-400 h-10 mb-2"></div>
          <p className="text-xs text-slate-500">Customer Acceptance</p>
        </div>
      </div>
    </div>
  );
}
