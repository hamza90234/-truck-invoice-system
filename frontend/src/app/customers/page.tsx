"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Building2, Phone, Mail, ChevronRight } from "lucide-react";
import { API_URL } from "@/lib/config";

interface Customer {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/customers`);
        if (!res.ok) throw new Error("Failed to fetch customers");
        const data = await res.json();
        setCustomers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.contactPerson && c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="max-w-5xl mx-auto md:p-8 relative min-h-[calc(100vh-64px)] pb-24 md:pb-8">
      {/* Header - Native App Style */}
      <div className="px-4 py-4 md:py-0 md:mb-8 bg-slate-50 sticky top-0 z-10 border-b border-slate-200 md:border-none md:bg-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base hidden md:block">Manage your client base and view their history.</p>
          </div>
          {/* Desktop Add Button (Hidden on Mobile) */}
          <Link 
            href="/customers/new" 
            className="hidden md:flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="h-5 w-5" />
            Add Customer
          </Link>
        </div>
      </div>

      <div className="md:bg-white md:border md:border-slate-200 md:rounded-2xl md:shadow-sm overflow-hidden mb-6">
        {/* Search Bar - Edge-to-Edge on Mobile */}
        <div className="p-4 border-b border-slate-200 bg-white md:bg-slate-50 sticky top-[65px] md:top-auto z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by company, contact, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 md:py-2.5 bg-slate-100 md:bg-white border-transparent md:border-slate-300 text-slate-900 rounded-xl md:rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-none md:shadow-sm"
            />
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="p-12 flex justify-center bg-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-white">
            {error}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white">
            No customers found. Try a different search or add a new customer.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 md:divide-slate-200 bg-white">
            {filteredCustomers.map((customer) => (
              <Link 
                key={customer.id} 
                href={`/customers/${customer.id}`}
                className="flex items-center p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors group cursor-pointer"
              >
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full md:rounded-xl flex items-center justify-center shrink-0 mr-4 group-hover:bg-blue-100 transition-colors">
                  <Building2 className="h-6 w-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] md:text-base font-semibold text-slate-900 truncate">
                    {customer.companyName}
                  </h3>
                  <div className="mt-0.5 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 text-[13px] md:text-sm text-slate-500">
                    {customer.contactPerson && (
                      <span className="truncate">{customer.contactPerson}</span>
                    )}
                    {customer.phone && (
                      <span className="flex items-center gap-1 truncate">
                        <Phone className="h-3 w-3 hidden sm:block" />
                        {customer.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-4 text-slate-300 md:text-slate-400 group-hover:text-blue-600 transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <Link 
        href="/customers/new" 
        className="md:hidden fixed bottom-20 right-6 h-14 w-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_rgba(37,99,235,0.4)] active:scale-95 transition-transform z-20"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
