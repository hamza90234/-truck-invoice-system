"use client";

import { useState, useRef, useEffect } from "react";
import { Building2, Search, X, Check, Plus, ChevronDown, Phone, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

export interface CustomerOption {
  id: string;
  companyName: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface SearchableCustomerSelectProps {
  customers: CustomerOption[];
  value: string;
  onChange: (customerId: string) => void;
  onAddNewCustomer?: () => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export default function SearchableCustomerSelect({
  customers,
  value,
  onChange,
  onAddNewCustomer,
  disabled = false,
  required = false,
  placeholder = "Tap to search & select customer...",
}: SearchableCustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = customers.find((c) => c.id === value);

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

  // Lock body scroll on mobile when modal is open
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

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const nameMatch = c.companyName?.toLowerCase().includes(term);
    const contactMatch = c.contactPerson?.toLowerCase().includes(term);
    const phoneMatch = c.phone?.toLowerCase().includes(term);
    return nameMatch || contactMatch || phoneMatch;
  });

  const handleSelect = (customerId: string) => {
    onChange(customerId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="relative w-full">
      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Trigger Button - Mobile First (Large touch target min-h-[48px]) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={`w-full min-h-[48px] sm:min-h-[44px] flex items-center justify-between text-left px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-[0.99] ${
          disabled
            ? "opacity-60 bg-slate-100 cursor-not-allowed border-slate-200"
            : isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20 bg-white"
            : "border-slate-300 hover:border-slate-400 hover:bg-white active:bg-slate-100"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4" />
          </div>

          {selectedCustomer ? (
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 truncate text-sm">
                {selectedCustomer.companyName}
              </div>
              {(selectedCustomer.contactPerson || selectedCustomer.phone) && (
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                  {selectedCustomer.contactPerson && (
                    <span className="truncate">{selectedCustomer.contactPerson}</span>
                  )}
                  {selectedCustomer.contactPerson && selectedCustomer.phone && <span>•</span>}
                  {selectedCustomer.phone && (
                    <span className="font-mono">{selectedCustomer.phone}</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <span className="text-slate-400 font-medium text-xs sm:text-sm truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {selectedCustomer && !disabled && (
            <span
              role="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
      </button>

      {/* Mobile First Bottom Sheet / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop dismissal */}
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)}
          />

          {/* Modal / Bottom-Sheet Container */}
          <div className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 overflow-hidden flex flex-col h-[88dvh] sm:h-[80vh] sm:max-h-[700px] z-10 animate-in slide-in-from-bottom-6 duration-200">
            {/* Mobile Drag Indicator Handle */}
            <div className="pt-2.5 pb-1 sm:hidden flex justify-center bg-slate-50/80">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Modal Header */}
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
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                      Select Customer
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {filteredCustomers.length} available
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onAddNewCustomer ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onAddNewCustomer();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ New</span>
                  </button>
                ) : (
                  <Link
                    href="/customers/new"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-3 py-1.5 rounded-xl shadow-xs transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ New</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="hidden sm:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search Input Bar (text-base on mobile prevents iOS auto-zoom) */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-white shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by company name, contact, phone..."
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

            {/* Customer List (Mobile-friendly thumb items) */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2 sm:p-3 space-y-1">
              {filteredCustomers.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 text-slate-400">
                    <Search className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">No customers found</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      No matching records for &quot;{searchTerm}&quot;
                    </p>
                  </div>
                  <div>
                    {onAddNewCustomer ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onAddNewCustomer();
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:bg-blue-800 shadow-sm transition cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Create New Customer
                      </button>
                    ) : (
                      <Link
                        href="/customers/new"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:bg-blue-800 shadow-sm transition"
                      >
                        <Plus className="h-4 w-4" />
                        Create New Customer
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = cust.id === value;
                  return (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => handleSelect(cust.id)}
                      className={`w-full min-h-[58px] flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer active:scale-[0.99] ${
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
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {cust.companyName}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 truncate flex-wrap">
                            {cust.contactPerson && (
                              <span className="inline-flex items-center gap-1 truncate font-medium">
                                <User className="h-3 w-3 text-slate-400 shrink-0" />
                                {cust.contactPerson}
                              </span>
                            )}
                            {cust.phone && (
                              <span className="inline-flex items-center gap-1 truncate font-mono text-slate-600">
                                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                {cust.phone}
                              </span>
                            )}
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
