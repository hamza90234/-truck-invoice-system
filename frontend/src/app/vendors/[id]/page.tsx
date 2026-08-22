"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Building2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Package, 
  DollarSign, 
  Trash2, 
  Pencil, 
  X,
  AlertCircle,
  ShoppingBag
} from "lucide-react";
import { API_URL } from "@/lib/config";

interface PurchaseItemLine {
  id: string;
  partId: string;
  quantity: string;
  unitCost: string;
}

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [vendor, setVendor] = useState<any>(null);
  const [partsCatalog, setPartsCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Record Purchase Modal
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [purchaseStatus, setPurchaseStatus] = useState("UNPAID");
  const [purchaseAmountOverride, setPurchaseAmountOverride] = useState("");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemLine[]>([]);
  const [submittingPurchase, setSubmittingPurchase] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");

  // Edit Vendor Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editContactInfo, setEditContactInfo] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const [vendorRes, partsRes] = await Promise.all([
        fetch(`${API_URL}/api/vendors/${id}`),
        fetch(`${API_URL}/api/parts`).catch(() => null)
      ]);

      if (!vendorRes.ok) {
        if (vendorRes.status === 404) throw new Error("Vendor not found");
        throw new Error("Failed to load vendor");
      }

      const vendorData = await vendorRes.json();
      setVendor(vendorData);
      setEditName(vendorData.name || "");
      setEditContactInfo(vendorData.contactInfo || "");

      if (partsRes && partsRes.ok) {
        const partsData = await partsRes.json();
        setPartsCatalog(partsData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, [id]);

  const handleAddPartRow = () => {
    setPurchaseItems([
      ...purchaseItems,
      { id: `row-${Date.now()}`, partId: "", quantity: "1", unitCost: "" }
    ]);
  };

  const handleUpdatePartRow = (rowId: string, field: keyof PurchaseItemLine, val: string) => {
    setPurchaseItems(purchaseItems.map(item => {
      if (item.id !== rowId) return item;
      if (field === "partId" && val) {
        const selected = partsCatalog.find(p => p.id === val);
        return {
          ...item,
          partId: val,
          unitCost: selected?.purchaseCost?.toString() || ""
        };
      }
      return { ...item, [field]: val };
    }));
  };

  const handleRemovePartRow = (rowId: string) => {
    setPurchaseItems(purchaseItems.filter(item => item.id !== rowId));
  };

  // Compute total from line items or override
  const calculatedItemsTotal = purchaseItems.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const cost = parseFloat(item.unitCost) || 0;
    return acc + (qty * cost);
  }, 0);

  const finalPurchaseTotal = purchaseItems.length > 0 
    ? calculatedItemsTotal 
    : (parseFloat(purchaseAmountOverride) || 0);

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalPurchaseTotal <= 0) {
      setPurchaseError("Purchase total must be greater than $0.00");
      return;
    }

    setSubmittingPurchase(true);
    setPurchaseError("");

    try {
      const validItems = purchaseItems
        .filter(item => item.partId && (parseFloat(item.quantity) || 0) > 0)
        .map(item => ({
          partId: item.partId,
          quantity: parseInt(item.quantity, 10),
          unitCost: parseFloat(item.unitCost) || 0
        }));

      const res = await fetch(`${API_URL}/api/vendors/${id}/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: finalPurchaseTotal,
          date: purchaseDate,
          status: purchaseStatus,
          items: validItems
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record purchase order");
      }

      setShowPurchaseModal(false);
      setPurchaseItems([]);
      setPurchaseAmountOverride("");
      fetchVendorData();
    } catch (err: any) {
      setPurchaseError(err.message);
    } finally {
      setSubmittingPurchase(false);
    }
  };

  const handleMarkPaid = async (purchaseId: string) => {
    if (!window.confirm("Mark this purchase order as PAID? This will reduce the vendor's balance.")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/vendors/purchases/${purchaseId}/pay`, {
        method: "PATCH"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark as paid");
      }

      fetchVendorData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);

    try {
      const res = await fetch(`${API_URL}/api/vendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          contactInfo: editContactInfo.trim() || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update vendor");
      }

      setShowEditModal(false);
      fetchVendorData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!window.confirm("Are you sure you want to delete this vendor? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/vendors/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete vendor");
      }
      router.push("/vendors");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-8 text-center text-slate-400 text-sm">Loading vendor...</div>;
  }

  if (error || !vendor) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm inline-block">{error || "Vendor not found"}</div>
        <div>
          <Link href="/vendors" className="text-blue-600 font-semibold text-xs hover:underline">&larr; Back to Vendors</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12 bg-slate-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/vendors" className="text-slate-500 hover:text-slate-900 p-1 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base md:text-lg font-bold text-slate-900 leading-tight">{vendor.name}</h1>
            <p className="text-xs text-slate-500">Parts Supplier Profile & Orders</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Restock / Record Purchase
          </button>
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDeleteVendor}
            className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6">
        {/* Vendor Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contact & Address</span>
            <h2 className="text-base font-bold text-slate-900">{vendor.name}</h2>
            {vendor.contactInfo ? (
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{vendor.contactInfo}</p>
            ) : (
              <p className="text-xs text-slate-400 italic">No contact information provided.</p>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Outstanding Balance (A/P)</span>
              <div className={`text-2xl md:text-3xl font-extrabold mt-1 ${Number(vendor.balance) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                ${Number(vendor.balance).toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Number(vendor.balance) > 0 ? "Unpaid balance owed to supplier" : "All purchases paid in full"}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${Number(vendor.balance) > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Purchase Orders List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
              Purchase Orders & Invoices History
            </h2>
            <span className="text-xs text-slate-500">{vendor.purchases?.length || 0} orders recorded</span>
          </div>

          {!vendor.purchases || vendor.purchases.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50">
              <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No purchases recorded yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Click &quot;Restock / Record Purchase&quot; to log parts bought from this supplier.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Order Amount</th>
                    <th className="py-3 px-3 text-center">Payment Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendor.purchases.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 text-slate-800 font-medium whitespace-nowrap">
                        {new Date(p.date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                        ${Number(p.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {p.status === "PAID" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            UNPAID
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        {p.status === "UNPAID" && (
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(p.id)}
                            className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-lg text-xs transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                Record Parts Purchase Order
              </h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {purchaseError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{purchaseError}</span>
              </div>
            )}

            <form onSubmit={handleRecordPurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={purchaseStatus}
                    onChange={(e) => setPurchaseStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option value="UNPAID">Unpaid (Add to A/P Balance)</option>
                    <option value="PAID">Paid Upfront</option>
                  </select>
                </div>
              </div>

              {/* Parts Restocking Section */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-blue-600" /> Restock Parts in Inventory (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPartRow}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded"
                  >
                    + Add Part
                  </button>
                </div>

                {purchaseItems.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500">
                      No specific inventory parts selected. You can enter a lump-sum amount below, or click &quot;+ Add Part&quot; to automatically increment stock quantities.
                    </p>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Lump-Sum Purchase Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="e.g. 800.00"
                        value={purchaseAmountOverride}
                        onChange={(e) => setPurchaseAmountOverride(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {purchaseItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <select
                          value={item.partId}
                          onChange={(e) => handleUpdatePartRow(item.id, "partId", e.target.value)}
                          required
                          className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="">Select Part...</option>
                          {partsCatalog.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.partNumber}] {p.name} (Current Stock: {p.stockQuantity})
                            </option>
                          ))}
                        </select>

                        <div className="w-16">
                          <input
                            type="number"
                            step="1"
                            min="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleUpdatePartRow(item.id, "quantity", e.target.value)}
                            required
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right"
                          />
                        </div>

                        <div className="w-20">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Cost/ea"
                            value={item.unitCost}
                            onChange={(e) => handleUpdatePartRow(item.id, "unitCost", e.target.value)}
                            required
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePartRow(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Total Purchase Amount:</span>
                <span className="text-base font-extrabold text-blue-600">
                  ${finalPurchaseTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPurchase}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submittingPurchase ? "Saving..." : "Record Order & Restock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Vendor Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vendor Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Info / Address</label>
                <textarea
                  rows={3}
                  value={editContactInfo}
                  onChange={(e) => setEditContactInfo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
