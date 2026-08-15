"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { API_URL } from "../../lib/config";

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    shopName: "",
    address: "",
    phone: "",
    website: "",
    logoUrl: "",
    taxId: "",
    defaultTaxRate: "8.25",
    defaultPaymentTerms: "Net 30",
    creditCardFeePct: "3.00",
    invoiceSettings: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          defaultTaxRate: parseFloat(formData.defaultTaxRate),
          creditCardFeePct: parseFloat(formData.creditCardFeePct)
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      localStorage.setItem("token", data.token);
      router.push("/dashboard"); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Setup Shop Profile</h2>
              <p className="text-slate-500 text-sm">Configure your truck repair business details.</p>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6 pb-24 md:pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-900 mb-2">Account Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email (Login ID)</label>
                  <input type="email" name="email" required onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input type="password" name="password" required onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-900 mb-2">Business Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
                  <input type="text" name="shopName" required onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input type="tel" name="phone" required onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Address</label>
                  <input type="text" name="address" required onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website (Optional)</label>
                  <input type="url" name="website" onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL (Optional)</label>
                  <input type="url" name="logoUrl" onChange={handleChange} placeholder="https://..." className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID / EIN</label>
                  <input type="text" name="taxId" onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
                </div>
              </div>

            </div>

            <div className="pt-4 space-y-4 border-t border-slate-200">
              <h3 className="text-lg font-medium text-slate-900 mb-2">Invoice Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Default Tax (%)</label>
                  <input type="number" step="0.01" name="defaultTaxRate" defaultValue="8.25" onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CC Fee (%)</label>
                  <input type="number" step="0.01" name="creditCardFeePct" defaultValue="3.00" onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Terms</label>
                  <input type="text" name="defaultPaymentTerms" defaultValue="Net 30" onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Notes / Footer Settings</label>
                <textarea name="invoiceSettings" rows={3} onChange={handleChange as any} placeholder="e.g. Thank you for your business! All parts come with a 30-day warranty." className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"></textarea>
              </div>
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:relative md:p-0 md:bg-transparent md:border-t md:border-slate-200 md:pt-6 flex justify-end z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:shadow-none pb-safe">
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-4 md:py-3 rounded-xl md:rounded-lg transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 w-full md:w-auto justify-center text-lg md:text-base"
              >
                {loading ? "Creating Shop Profile..." : "Complete Setup"}
              </button>
            </div>
          </form>
          
        </div>
      </div>
    </div>
  );
}
