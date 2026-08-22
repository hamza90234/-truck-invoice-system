"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Search, Plus, AlertTriangle, ArrowRight } from "lucide-react";
import { API_URL } from "@/lib/config";

interface Part {
  id: string;
  partNumber: string;
  name: string;
  description: string;
  purchaseCost: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStockLevel: number;
}

export default function InventoryPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/parts`);
        if (!res.ok) throw new Error("Failed to fetch inventory");
        const data = await res.json();
        setParts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, []);

  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.partNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-12">
      {/* Header section */}
      <div className="bg-white md:bg-transparent px-4 py-4 md:px-8 md:py-8 sticky top-0 md:static z-20 border-b border-slate-200 md:border-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500 mt-1 hidden md:block">Manage your shop's parts and stock levels</p>
        </div>
        
        <Link 
          href="/inventory/new"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 md:py-2 rounded-xl md:rounded-lg font-medium transition-colors shadow-sm text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Part
        </Link>
      </div>

      <div className="px-4 md:px-8">
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by part number or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 md:py-2.5 border border-slate-200 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-sm text-sm"
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Parts List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No parts found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              {searchQuery ? "Try adjusting your search terms." : "Get started by adding your first part to the inventory."}
            </p>
            {!searchQuery && (
              <Link 
                href="/inventory/new"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Part
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParts.map((part) => {
              const isLowStock = part.stockQuantity <= part.minimumStockLevel;
              const isOutOfStock = part.stockQuantity === 0;

              return (
                <Link 
                  key={part.id} 
                  href={`/inventory/${part.id}/edit`}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                      <div className="text-xs font-mono text-slate-500 mb-1">{part.partNumber}</div>
                      <h3 className="font-semibold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                        {part.name}
                      </h3>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Price</div>
                      <div className="font-medium text-slate-900">${Number(part.sellingPrice).toFixed(2)}</div>
                    </div>
                    
                    <div className="text-right flex items-center gap-2">
                      <div className="flex flex-col items-end">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Stock</div>
                        <div className={`font-medium ${
                          isOutOfStock ? "text-red-600" : 
                          isLowStock ? "text-amber-600" : "text-emerald-600"
                        }`}>
                          {part.stockQuantity}
                        </div>
                      </div>
                      {(isLowStock || isOutOfStock) && (
                        <div className={`p-1 rounded-md ${isOutOfStock ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"}`}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
