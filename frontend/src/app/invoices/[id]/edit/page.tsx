"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  Wrench, 
  Package, 
  Building2, 
  AlertTriangle,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { API_URL } from "@/lib/config";

interface PartOption {
  id: string;
  partNumber: string;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
}

interface LaborLine {
  id: string;
  description: string;
  quantity: string;
  rate: string;
}

interface PartLine {
  id: string;
  partId: string;
  description: string;
  quantity: string;
  rate: string;
  stockQuantity?: number;
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [invoice, setInvoice] = useState<any>(null);
  const [partsCatalog, setPartsCatalog] = useState<PartOption[]>([]);

  // Form Fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [taxRate, setTaxRate] = useState("8.25");
  const [status, setStatus] = useState("UNPAID");
  const [notes, setNotes] = useState("");
  const [warrantyInfo, setWarrantyInfo] = useState("");

  const [laborItems, setLaborItems] = useState<LaborLine[]>([]);
  const [partItems, setPartItems] = useState<PartLine[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [invRes, partsRes] = await Promise.all([
          fetch(`${API_URL}/api/invoices/${id}`),
          fetch(`${API_URL}/api/parts`)
        ]);

        if (!invRes.ok) throw new Error("Failed to load invoice");
        const invData = await invRes.json();
        setInvoice(invData);

        if (partsRes.ok) {
          const partsList = await partsRes.json();
          setPartsCatalog(partsList);
        }

        // Initialize state
        setInvoiceNumber(invData.invoiceNumber || "");
        setInvoiceDate(invData.date ? new Date(invData.date).toISOString().split("T")[0] : "");
        setDueDate(invData.dueDate ? new Date(invData.dueDate).toISOString().split("T")[0] : "");
        setPaymentTerms(invData.paymentTerms || "Net 30");
        setStatus(invData.status || "UNPAID");
        setNotes(invData.notes || "");
        setWarrantyInfo(invData.warrantyInfo || "");

        // Determine effective tax rate from subtotal and taxAmount
        if (Number(invData.subtotal) > 0 && Number(invData.taxAmount) > 0) {
          const computedRate = ((Number(invData.taxAmount) / Number(invData.subtotal)) * 100).toFixed(2);
          setTaxRate(computedRate);
        } else if (invData.shopProfile?.defaultTaxRate !== undefined) {
          setTaxRate(invData.shopProfile.defaultTaxRate.toString());
        }

        // Split items
        const labor = invData.items
          ?.filter((i: any) => i.type === "LABOR")
          .map((i: any) => ({
            id: i.id || `labor-${Math.random()}`,
            description: i.description || "",
            quantity: i.quantity?.toString() || "1",
            rate: i.rate?.toString() || "0"
          })) || [];

        const parts = invData.items
          ?.filter((i: any) => i.type === "PART")
          .map((i: any) => ({
            id: i.id || `part-${Math.random()}`,
            partId: i.partId || "",
            description: i.description || "",
            quantity: i.quantity?.toString() || "1",
            rate: i.rate?.toString() || "0",
            stockQuantity: i.part?.stockQuantity
          })) || [];

        setLaborItems(labor.length > 0 ? labor : [{ id: "labor-1", description: "", quantity: "1", rate: "120" }]);
        setPartItems(parts);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id]);

  // Quick Part Add Modal
  const [showPartModal, setShowPartModal] = useState(false);
  const [newPart, setNewPart] = useState({ partNumber: "", name: "", sellingPrice: "", purchaseCost: "", stockQuantity: "0", minimumStockLevel: "5" });
  const [savingPart, setSavingPart] = useState(false);
  const [partError, setPartError] = useState("");

  const handleQuickAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPart(true);
    setPartError("");
    try {
      const res = await fetch(`${API_URL}/api/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPart,
          sellingPrice: parseFloat(newPart.sellingPrice) || 0,
          purchaseCost: parseFloat(newPart.purchaseCost) || 0,
          stockQuantity: parseInt(newPart.stockQuantity, 10) || 0,
          minimumStockLevel: parseInt(newPart.minimumStockLevel, 10) || 0,
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create part");
      }
      const createdPart = await res.json();
      
      // Update parts catalog directly
      setPartsCatalog([...partsCatalog, createdPart]);
      
      setShowPartModal(false);
      
      // Auto-add it to the invoice lines
      const newRowId = `part-${Date.now()}`;
      setPartItems([...partItems, {
        id: newRowId,
        partId: createdPart.id,
        description: `[${createdPart.partNumber}] ${createdPart.name}`,
        quantity: "1",
        rate: createdPart.sellingPrice.toString(),
        stockQuantity: createdPart.stockQuantity
      }]);
      setNewPart({ partNumber: "", name: "", sellingPrice: "", purchaseCost: "", stockQuantity: "0", minimumStockLevel: "5" });
    } catch (err: any) {
      setPartError(err.message);
    } finally {
      setSavingPart(false);
    }
  };

  // Labor Actions
  const addLaborRow = () => {
    setLaborItems([
      ...laborItems,
      { id: `labor-${Date.now()}`, description: "", quantity: "1", rate: "120" }
    ]);
  };

  const updateLaborRow = (rowId: string, field: keyof LaborLine, val: string) => {
    setLaborItems(laborItems.map(item => item.id === rowId ? { ...item, [field]: val } : item));
  };

  const removeLaborRow = (rowId: string) => {
    if (laborItems.length === 1) {
      setLaborItems([{ id: `labor-${Date.now()}`, description: "", quantity: "", rate: "" }]);
    } else {
      setLaborItems(laborItems.filter(item => item.id !== rowId));
    }
  };

  // Parts Actions
  const addPartRow = () => {
    setPartItems([
      ...partItems,
      { id: `part-${Date.now()}`, partId: "", description: "", quantity: "1", rate: "0" }
    ]);
  };

  const selectPartFromCatalog = (rowId: string, partId: string) => {
    if (!partId) {
      setPartItems(partItems.map(item => item.id === rowId ? { ...item, partId: "", description: "", rate: "0", stockQuantity: undefined } : item));
      return;
    }

    const selected = partsCatalog.find(p => p.id === partId);
    if (selected) {
      setPartItems(partItems.map(item => item.id === rowId ? {
        ...item,
        partId: selected.id,
        description: `[${selected.partNumber}] ${selected.name}`,
        rate: selected.sellingPrice.toString(),
        stockQuantity: selected.stockQuantity
      } : item));
    }
  };

  const updatePartRow = (rowId: string, field: keyof PartLine, val: string) => {
    setPartItems(partItems.map(item => item.id === rowId ? { ...item, [field]: val } : item));
  };

  const removePartRow = (rowId: string) => {
    setPartItems(partItems.filter(item => item.id !== rowId));
  };

  // Calculations
  const laborSubtotal = laborItems.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return acc + (qty * rate);
  }, 0);

  const partsSubtotal = partItems.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return acc + (qty * rate);
  }, 0);

  const subtotal = laborSubtotal + partsSubtotal;
  const taxRateNum = parseFloat(taxRate) || 0;
  // Apply tax ONLY to parts
  const taxAmount = (partsSubtotal * taxRateNum) / 100;
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validLabor = laborItems
      .filter(l => l.description.trim() !== "" && (parseFloat(l.quantity) || 0) > 0)
      .map(l => ({
        type: "LABOR",
        description: l.description.trim(),
        quantity: parseFloat(l.quantity) || 1,
        rate: parseFloat(l.rate) || 0
      }));

    const validParts = partItems
      .filter(p => p.description.trim() !== "" && (parseFloat(p.quantity) || 0) > 0)
      .map(p => ({
        type: "PART",
        partId: p.partId || null,
        description: p.description.trim(),
        quantity: parseFloat(p.quantity) || 1,
        rate: parseFloat(p.rate) || 0
      }));

    if (validLabor.length === 0 && validParts.length === 0) {
      setError("Please include at least one valid Labor or Part line item.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        invoiceNumber: invoiceNumber.trim(),
        date: invoiceDate,
        dueDate: dueDate || null,
        paymentTerms,
        taxRate: taxRateNum,
        status,
        notes,
        warrantyInfo,
        items: [...validLabor, ...validParts]
      };

      const res = await fetch(`${API_URL}/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update invoice");
      }

      router.push(`/invoices/${id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loadingData) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading invoice for editing...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-12 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link href={`/invoices/${id}`} className="text-slate-500 hover:text-slate-900 p-1 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base md:text-lg font-bold text-slate-900 leading-tight">Edit Invoice {invoice?.invoiceNumber}</h1>
            <p className="text-xs text-slate-500">Update labor, parts, or billing terms</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer & Vehicle Display */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Customer</span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">{invoice?.customer?.companyName}</span>
            <span className="text-slate-500">{invoice?.customer?.contactPerson}</span>
          </div>
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Vehicle</span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">
              Unit #{invoice?.vehicle?.unitNumber || "N/A"} — {invoice?.vehicle?.year} {invoice?.vehicle?.make} {invoice?.vehicle?.model}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">VIN: {invoice?.vehicle?.vin}</span>
          </div>
        </div>

        {/* Invoice Terms & Dates */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="h-4 w-4 text-blue-600" />
            Invoice Terms & Dates
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Labor Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-600" />
              Labor / Services
            </h2>
            <button
              type="button"
              onClick={addLaborRow}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Labor
            </button>
          </div>

          <div className="space-y-3">
            {laborItems.map((item) => {
              const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
              return (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60">
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Labor Description"
                      value={item.description}
                      onChange={(e) => updateLaborRow(item.id, "description", e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="w-20">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        placeholder="Hours"
                        value={item.quantity}
                        onChange={(e) => updateLaborRow(item.id, "quantity", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-400 block text-right pr-1">Hours</span>
                    </div>

                    <div className="w-24">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => updateLaborRow(item.id, "rate", e.target.value)}
                          className="w-full pl-5 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block text-right pr-1">Rate/hr</span>
                    </div>

                    <div className="w-24 text-right font-bold text-slate-900 text-xs px-2">
                      ${lineTotal.toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeLaborRow(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Parts Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              Parts & Materials
            </h2>
            <button
              type="button"
              onClick={addPartRow}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Part
            </button>
          </div>

          <div className="space-y-3">
            {partItems.map((item) => {
              const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
              return (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60">
                  <div className="flex-1 w-full space-y-1.5">
                    <select
                      value={item.partId}
                      onChange={(e) => {
                        if (e.target.value === "CREATE_NEW") {
                          setShowPartModal(true);
                        } else {
                          selectPartFromCatalog(item.id, e.target.value);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                    >
                      <option value="">Custom Non-Inventory Part</option>
                      <option value="CREATE_NEW" className="font-bold text-blue-600">+ Add New Part to Inventory</option>
                      <optgroup label="Catalog Parts">
                        {partsCatalog.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.partNumber}] {p.name} — ${Number(p.sellingPrice).toFixed(2)} (Stock: {p.stockQuantity})
                          </option>
                        ))}
                      </optgroup>
                    </select>

                    <input
                      type="text"
                      placeholder="Part Description"
                      value={item.description}
                      onChange={(e) => updatePartRow(item.id, "description", e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="w-20">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updatePartRow(item.id, "quantity", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-400 block text-right pr-1">Qty</span>
                    </div>

                    <div className="w-24">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Price"
                          value={item.rate}
                          onChange={(e) => updatePartRow(item.id, "rate", e.target.value)}
                          className="w-full pl-5 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block text-right pr-1">Unit Price</span>
                    </div>

                    <div className="w-24 text-right font-bold text-slate-900 text-xs px-2">
                      ${lineTotal.toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removePartRow(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Notes & Terms</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Repair Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Terms</label>
              <textarea
                rows={2}
                value={warrantyInfo}
                onChange={(e) => setWarrantyInfo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Updated Summary</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Labor Subtotal:</span>
                <span className="font-semibold text-slate-800">${laborSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Parts Subtotal:</span>
                <span className="font-semibold text-slate-800">${partsSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-slate-100">
                <span>Total Pre-Tax Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">Tax Rate (%):</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-16 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-right font-medium"
                  />
                </div>
                <span className="font-semibold text-slate-800">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t-2 border-slate-200">
                <span>New Invoice Total:</span>
                <span className="text-blue-600 text-lg">${totalAmount.toFixed(2)}</span>
              </div>
              {Number(invoice?.amountPaid) > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-semibold pt-1">
                  <span>Already Paid:</span>
                  <span>-${Number(invoice.amountPaid).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href={`/invoices/${id}`}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving Changes..." : "Save Invoice Changes"}
          </button>
        </div>
      </form>

      {/* Quick Add Part Modal */}
      {showPartModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Part to Inventory</h3>
            {partError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg">{partError}</div>
            )}
            <form onSubmit={handleQuickAddPart} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Part Number *</label>
                  <input required type="text" value={newPart.partNumber} onChange={e => setNewPart({...newPart, partNumber: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Part Name *</label>
                  <input required type="text" value={newPart.name} onChange={e => setNewPart({...newPart, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price *</label>
                  <input required type="number" step="0.01" value={newPart.sellingPrice} onChange={e => setNewPart({...newPart, sellingPrice: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost</label>
                  <input type="number" step="0.01" value={newPart.purchaseCost} onChange={e => setNewPart({...newPart, purchaseCost: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Stock</label>
                  <input type="number" value={newPart.stockQuantity} onChange={e => setNewPart({...newPart, stockQuantity: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPartModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg">Cancel</button>
                <button type="submit" disabled={savingPart} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                  {savingPart ? "Saving..." : "Save & Add to Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
