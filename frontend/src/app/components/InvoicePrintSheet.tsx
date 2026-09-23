"use client";

import React from "react";

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
  const subtotal = laborSubtotal + partsSubtotal;
  const taxAmount = Number(invoice.taxAmount || 0);
  const totalAmount = Number(invoice.totalAmount || 0);
  const amountPaid = Number(invoice.amountPaid || 0);
  const balance = Number(invoice.balance ?? (totalAmount - amountPaid));
  const isPaid = balance <= 0 || invoice.status === "PAID";

  return (
    <div className="bg-white text-slate-800 w-full max-w-4xl mx-auto p-8 md:p-12 shadow-xs border border-slate-200 print:shadow-none print:border-none print:p-0">
      {/* HEADER */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
        <div>
          {shop.logoUrl ? (
            <img src={shop.logoUrl} alt="Logo" className="h-16 object-contain mb-4" />
          ) : (
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {shop.shopName || "YOUR SHOP NAME"}
            </h1>
          )}
          <div className="text-sm text-slate-500 space-y-1">
            {shop.address && <p>{shop.address}</p>}
            {shop.phone && <p>{shop.phone}</p>}
            {shop.email && <p>{shop.email}</p>}
            {shop.website && <p>{shop.website}</p>}
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-4xl font-light text-slate-900 mb-4 uppercase tracking-widest">Invoice</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-right justify-end">
            <span className="text-slate-500 font-medium">Invoice No:</span>
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
      <div className="grid grid-cols-2 gap-12 mb-10">
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
            Vehicle Information
          </h3>
          <div className="text-sm space-y-1">
            <p className="font-bold text-slate-900 text-base">
              {vehicle.year} {vehicle.make} {vehicle.model}
              {vehicle.unitNumber && <span className="ml-2 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">Unit #{vehicle.unitNumber}</span>}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-slate-600">
              <p><span className="font-semibold text-slate-500 mr-1">VIN:</span> {vehicle.vin || "N/A"}</p>
              <p><span className="font-semibold text-slate-500 mr-1">Odometer:</span> {vehicle.mileage ? vehicle.mileage.toLocaleString() : "N/A"}</p>
              <p><span className="font-semibold text-slate-500 mr-1">Plate:</span> {vehicle.licensePlate || "N/A"}</p>
              <p><span className="font-semibold text-slate-500 mr-1">Engine:</span> {vehicle.engine || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      {invoice.notes && (
        <div className="mb-10">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
            Service Description
          </h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* LINE ITEMS */}
      <div className="mb-10">
        <table className="w-full text-sm text-left">
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
                <td colSpan={4} className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 px-2">Labor</td>
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
                <td colSpan={4} className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 px-2 mt-4">Parts & Materials</td>
              </tr>
            )}
            {partItems.map((item: any, idx: number) => (
              <tr key={item.id || idx}>
                <td className="py-3 px-2 text-slate-800">
                  <span className="font-semibold mr-2">{item.part?.partNumber || item.partNumber || ""}</span>
                  {item.description}
                </td>
                <td className="py-3 text-right text-slate-600">{Number(item.quantity).toFixed(0)}</td>
                <td className="py-3 text-right text-slate-600">${Number(item.rate).toFixed(2)}</td>
                <td className="py-3 text-right text-slate-900 font-medium">${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTALS */}
      <div className="flex justify-end mb-12">
        <div className="w-full max-w-sm space-y-3">
          <div className="flex justify-between text-sm text-slate-600 px-2">
            <span>Subtotal</span>
            <span className="font-medium text-slate-900">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 px-2">
            <span>Tax</span>
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

      {/* FOOTER */}
      <div className="border-t border-slate-200 pt-8 text-xs text-slate-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">Terms & Conditions</h4>
            <p className="leading-relaxed">
              {invoice.warrantyInfo || "Thank you for your business. Payment is due according to the terms stated above. Late payments may be subject to additional fees."}
            </p>
          </div>
          <div className="text-left md:text-right">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">Payment Methods</h4>
            <p className="leading-relaxed">
              We accept Checks, ACH/Wire transfers, EFS/Comchek, and major Credit Cards. Please make checks payable to {shop.shopName || "our shop"}.
            </p>
          </div>
        </div>
      </div>

      {/* SIGNATURES */}
      <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 gap-12">
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
