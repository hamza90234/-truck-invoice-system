"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { API_URL } from "@/lib/config";

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    billingAddress: "",
    serviceAddress: "",
    usdot: "",
    mcNumber: "",
    ein: "",
    customerType: "",
    paymentTerms: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create customer");
      }

      const newCustomer = await res.json();
      router.push(`/customers/${newCustomer.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link href="/customers" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Customers
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">New Customer</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Enter the details for a new client.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 bg-white md:border md:border-slate-200 md:rounded-2xl md:p-8 md:shadow-sm pb-24 md:pb-0">
        
        {/* Core Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-slate-900 pb-2 border-b border-slate-200">Contact Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Company Name <span className="text-red-500">*</span></label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contact Person</label>
              <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium text-slate-900 pb-2 border-b border-slate-200">Address Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Billing Address</label>
              <input type="text" name="billingAddress" value={formData.billingAddress} onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Service Address</label>
              <input type="text" name="serviceAddress" value={formData.serviceAddress} onChange={handleChange} placeholder="If different from billing" className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Customer Type</label>
              <input type="text" name="customerType" value={formData.customerType} onChange={handleChange} placeholder="e.g. Fleet, Owner-Operator, Walk-in" className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Terms</label>
              <input type="text" name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} placeholder="e.g. Net 30, Due on Receipt" className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
          </div>
        </div>

        {/* Business Credentials */}
        <div className="pt-4 space-y-6">
          <h3 className="text-lg font-medium text-slate-900 pb-2 border-b border-slate-200">Business & Legal Identifiers</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">USDOT Number</label>
              <input type="text" name="usdot" value={formData.usdot} onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">MC Number</label>
              <input type="text" name="mcNumber" value={formData.mcNumber} onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">EIN / Tax ID</label>
              <input type="text" name="ein" value={formData.ein} onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Internal Notes</label>
            <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} placeholder="Any special instructions or details about this customer..." className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm resize-y"></textarea>
          </div>
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:relative md:p-0 md:bg-transparent md:border-t md:border-slate-200 md:pt-6 flex justify-end z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:shadow-none pb-safe">
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-4 md:py-3 rounded-xl md:rounded-lg transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 w-full md:w-auto justify-center text-lg md:text-base"
          >
            <Save className="h-5 w-5" />
            {loading ? "Saving..." : "Save Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
