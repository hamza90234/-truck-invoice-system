"use client";

import { useState, useRef, useEffect } from "react";
import { Package, Search, X, Check, Plus, ChevronDown, Sparkles, AlertCircle, ArrowLeft } from "lucide-react";

export interface PartOption {
  id: string;
  partNumber: string;
  name: string;
  sellingPrice: number | string;
  stockQuantity: number;
}

interface SearchablePartSelectProps {
  parts: PartOption[];
  value: string;
  onChange: (partId: string) => void;
  onAddNewPart?: () => void;
  disabled?: boolean;
}

export default function SearchablePartSelect({
  parts,
  value,
  onChange,
  onAddNewPart,
  disabled = false,
}: SearchablePartSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedPart = parts.find((p) => p.id === value);
  const isCustomPart = !value;

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Lock body scroll on mobile when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const filteredParts = parts.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const numMatch = p.partNumber?.toLowerCase().includes(term);
    const nameMatch = p.name?.toLowerCase().includes(term);
    return numMatch || nameMatch;
  });

  const handleSelect = (partId: string) => {
    onChange(partId);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      {/* Trigger Button - Mobile First (min-h-[46px], spacious and thumb-friendly) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={`w-full min-h-[46px] sm:min-h-[42px] flex items-center justify-between text-left px-3 py-2 bg-white border rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer active:scale-[0.99] ${
          disabled
            ? "opacity-60 bg-slate-100 cursor-not-allowed border-slate-200"
            : isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-slate-300 hover:border-slate-400 active:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedPart ? (
            <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
              <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] shrink-0 border border-slate-200 font-bold">
                {selectedPart.partNumber}
              </span>
              <span className="text-slate-900 truncate font-semibold text-xs sm:text-sm">
                {selectedPart.name}
              </span>
              <span className="text-blue-600 font-bold shrink-0 text-xs ml-auto sm:ml-0">
                ${Number(selectedPart.sellingPrice).toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-700">
              <Sparkles className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm">Custom Non-Inventory Part</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">(Tap to pick from catalog)</span>
            </div>
          )}
        </div>

        <ChevronDown className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
      </button>

      {/* Modal / Bottom-Sheet Picker */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop */}
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 overflow-hidden flex flex-col h-[88dvh] sm:h-[80vh] sm:max-h-[720px] z-10 animate-in slide-in-from-bottom-6 duration-200">
            {/* Mobile Drag Indicator Handle */}
            <div className="pt-2.5 pb-1 sm:hidden flex justify-center bg-slate-50/80">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                      Select Part / Material
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {parts.length} catalog items
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="hidden sm:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Action Buttons (Mobile-first large touch pills) */}
            <div className="p-3 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={`min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer active:scale-[0.99] ${
                  isCustomPart
                    ? "bg-blue-600 text-white border-blue-600 shadow-blue-500/20"
                    : "bg-white text-slate-700 hover:bg-slate-100 border-slate-300 active:bg-slate-100"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Custom Non-Inventory Part</span>
              </button>

              {onAddNewPart && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNewPart();
                  }}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer active:bg-blue-100"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add New Part to Inventory</span>
                </button>
              )}
            </div>

            {/* Search Input Bar (16px base on mobile avoids iOS zoom) */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-white shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search part #, name, or description..."
                  className="w-full pl-10 pr-10 py-3 bg-slate-100 focus:bg-white border border-transparent focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-md active:bg-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Parts Catalog List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2 sm:p-3 space-y-1">
              {filteredParts.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 text-slate-400">
                    <Search className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">No parts found</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      No catalog item matches &quot;{searchTerm}&quot;
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleSelect("")}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 active:bg-slate-300 transition"
                    >
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      Use as Custom Part
                    </button>
                    {onAddNewPart && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onAddNewPart();
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:bg-blue-800 shadow-sm transition"
                      >
                        <Plus className="h-4 w-4" />
                        Create New Part
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                filteredParts.map((p) => {
                  const isSelected = p.id === value;
                  const isLowStock = p.stockQuantity <= 0;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelect(p.id)}
                      className={`w-full min-h-[62px] flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer active:scale-[0.99] ${
                        isSelected
                          ? "bg-blue-50 text-blue-900 ring-1 ring-blue-500/30"
                          : "hover:bg-slate-50 active:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-bold border border-slate-200">
                              {p.partNumber}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {p.name}
                            </h4>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">
                              ${Number(p.sellingPrice).toFixed(2)}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                                isLowStock
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              Stock: {p.stockQuantity}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="ml-2 shrink-0 h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="h-4 w-4 stroke-[2.5]" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
              {/* Extra padding at bottom for iOS home bar */}
              <div className="h-8 sm:h-2" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
