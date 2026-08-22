"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Save, Trash2 } from "lucide-react";
import { API_URL } from "@/lib/config";

export default function EditPartPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [formData, setFormData] = useState({
    partNumber: "",
    name: "",
    description: "",
    purchaseCost: "",
    sellingPrice: "",
    stockQuantity: "",
    minimumStockLevel: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPart = async () => {
      try {
        const res = await fetch(`${API_URL}/api/parts/${id}`);
        if (!res.ok) throw new Error("Part not found");
        
        const data = await res.json();
        
        setFormData({
          partNumber: data.partNumber || "",
          name: data.name || "",
          description: data.description || "",
          purchaseCost: data.purchaseCost?.toString() || "",
          sellingPrice: data.sellingPrice?.toString() || "",
          stockQuantity: data.stockQuantity?.toString() || "0",
          minimumStockLevel: data.minimumStockLevel?.toString() || "5"
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPart();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/parts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update part");
      }

      router.push("/inventory");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this part? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/parts/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete part");
      }
      
      router.push("/inventory");
    } catch (err: any) {
      alert(err.message);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12 min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/inventory" className="text-slate-500 hover:text-slate-900 p-1 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg hidden md:block">
              <Package className="h-4 w-4" />
            </div>
            <h1 className="font-semibold text-slate-900 text-lg">Edit Part</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDelete}
            disabled={saving || isDeleting}
            className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-slate-300 hover:border-red-200 font-medium px-3 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 text-sm"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden md:inline">Delete</span>
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={saving || isDeleting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-70 text-sm"
          >
            {saving ? (
               <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden md:inline">{saving ? "Saving..." : "Save Changes"}</span>
            <span className="md:hidden">{saving ? "..." : "Save"}</span>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Identity Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">Part Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Part Name (Required) *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  placeholder="e.g. Cummins ISX Fuel Filter"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Part Number (Required) *</label>
                <input
                  type="text"
                  name="partNumber"
                  required
                  value={formData.partNumber}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none uppercase font-mono"
                  placeholder="e.g. FF5488"
                />
                <p className="text-xs text-slate-500 mt-1">Must be unique</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none resize-none"
                  placeholder="Optional details about this part..."
                />
              </div>
            </div>
          </div>

          {/* Pricing Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">Pricing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Cost ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    name="purchaseCost"
                    required
                    min="0"
                    value={formData.purchaseCost}
                    onChange={handleChange}
                    className="w-full pl-8 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    name="sellingPrice"
                    required
                    min="0"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    className="w-full pl-8 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Inventory Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">Stock Levels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock Quantity</label>
                <input
                  type="number"
                  name="stockQuantity"
                  required
                  min="0"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Warning Level</label>
                <input
                  type="number"
                  name="minimumStockLevel"
                  required
                  min="0"
                  value={formData.minimumStockLevel}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  placeholder="5"
                />
                <p className="text-xs text-slate-500 mt-1">Alerts when stock drops to this number</p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end md:hidden">
            <button 
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg transition-colors shadow-sm disabled:opacity-70 text-base"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
