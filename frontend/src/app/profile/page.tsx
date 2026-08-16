"use client";

import { useState, useEffect } from "react";
import { Store, Save } from "lucide-react";
import { API_URL } from "../../lib/config";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    shopName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logoUrl: "",
    taxId: "",
    defaultTaxRate: 8.25,
    defaultPaymentTerms: "Net 30",
    creditCardFeePct: 3.00,
    invoiceSettings: "",
    password: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/shop/profile`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();
        setFormData({
          shopName: data.shopName || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          logoUrl: data.logoUrl || "",
          taxId: data.taxId || "",
          defaultTaxRate: data.defaultTaxRate || 8.25,
          defaultPaymentTerms: data.defaultPaymentTerms || "Net 30",
          creditCardFeePct: data.creditCardFeePct || 3.00,
          invoiceSettings: data.invoiceSettings || "",
          password: "",
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/shop/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          defaultTaxRate: parseFloat(formData.defaultTaxRate as any),
          creditCardFeePct: parseFloat(formData.creditCardFeePct as any)
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-73px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Shop Profile</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Manage your business information and invoice settings</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 bg-white md:border md:border-slate-200 md:rounded-2xl md:p-8 md:shadow-sm pb-24 md:pb-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-slate-900 pb-2 border-b border-slate-200">Business Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Shop Name</label>
              <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} required className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Business Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium text-slate-900 pb-2 border-b border-slate-200">Identity & Tax</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
              <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Logo URL</label>
              <input type="url" name="logoUrl" value={formData.logoUrl} onChange={handleChange} placeholder="https://..." className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tax ID / EIN</label>
              <input type="text" name="taxId" value={formData.taxId} onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
          </div>

        </div>

        <div className="pt-8 space-y-6">
          <h3 className="text-lg font-medium text-slate-900 pb-2 border-b border-slate-200">Security</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">New Password (leave blank to keep current)</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter new password..." className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
          </div>
        </div>

        <div className="pt-8 space-y-6">
          <h3 className="text-lg font-medium text-slate-900 pb-2 border-b border-slate-200">Default Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Default Tax Rate (%)</label>
              <input type="number" step="0.01" name="defaultTaxRate" value={formData.defaultTaxRate} onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Credit Card Fee (%)</label>
              <input type="number" step="0.01" name="creditCardFeePct" value={formData.creditCardFeePct} onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Default Payment Terms</label>
              <input type="text" name="defaultPaymentTerms" value={formData.defaultPaymentTerms} onChange={handleChange} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm" />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Invoice Notes / Footer Settings</label>
            <textarea name="invoiceSettings" rows={4} value={formData.invoiceSettings} onChange={handleChange} placeholder="e.g. Thank you for your business! All parts come with a 30-day warranty." className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm resize-y"></textarea>
          </div>
        </div>
        
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-slate-200 md:relative md:bottom-auto md:p-0 md:bg-transparent md:border-t md:border-slate-200 md:pt-6 flex justify-end z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:shadow-none pb-safe">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-4 md:py-3 rounded-xl md:rounded-lg transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 w-full md:w-auto justify-center text-lg md:text-base"
          >
            <Save className="h-5 w-5" />
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
