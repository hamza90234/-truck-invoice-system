"use client";

import { useState, useEffect } from "react";
import { Building2, Truck, CheckCircle2, AlertCircle, Send, ShieldCheck, MapPin, Phone, Mail, FileText } from "lucide-react";
import { API_URL } from "@/lib/config";
import AiVinScanner from "@/app/components/AiVinScanner";

interface ShopInfo {
  shopName: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string | null;
}

export default function CustomerOnboardPage() {
  const [shop, setShop] = useState<ShopInfo>({
    shopName: "AJ Road Service & Repair",
    phone: "",
    email: "",
    address: "",
  });

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    billingAddress: "",
    serviceAddress: "",
    sameAddress: true,
    usdot: "",
    mcNumber: "",
    ein: "",
    notes: "",
    // Initial Vehicle details
    unitNumber: "",
    vin: "",
    year: "",
    make: "",
    model: "",
    licensePlate: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch shop branding details
    fetch(`${API_URL}/api/shop/public`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.shopName) {
          setShop(data);
        }
      })
      .catch((err) => console.log("Shop public info not loaded, using defaults:", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "billingAddress" && prev.sameAddress ? { serviceAddress: value } : {}),
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      sameAddress: checked,
      serviceAddress: checked ? prev.billingAddress : prev.serviceAddress,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.companyName.trim()) {
      setError("Please provide your Company Name.");
      setLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError("Please provide a contact Phone Number.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        companyName: formData.companyName.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        billingAddress: formData.billingAddress.trim(),
        serviceAddress: formData.sameAddress ? formData.billingAddress.trim() : formData.serviceAddress.trim(),
        usdot: formData.usdot.trim(),
        mcNumber: formData.mcNumber.trim(),
        ein: formData.ein.trim(),
        notes: formData.notes.trim(),
        unitNumber: formData.unitNumber.trim(),
        vin: formData.vin.trim().toUpperCase(),
        year: formData.year.trim(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        licensePlate: formData.licensePlate.trim().toUpperCase(),
      };

      const res = await fetch(`${API_URL}/api/customers/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit registration. Please verify details.");
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while submitting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header / Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={shop.logoUrl || "/logo.jpg"} 
              alt={shop.shopName || "AJ Road Service & Repair"} 
              className="h-24 sm:h-28 w-auto max-w-[280px] object-contain rounded-2xl shadow-md"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
            Customer & Fleet Registration
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Submit your company and equipment details for faster service & billing
          </p>
          {(shop.phone || shop.email) && (
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-500">
              {shop.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {shop.phone}</span>}
              {shop.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {shop.email}</span>}
            </div>
          )}
        </div>

        {/* Confirmation Screen */}
        {submitted ? (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-12 text-center animate-in fade-in duration-300">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 mb-6">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Registration Submitted!
            </h2>
            <p className="mt-3 text-base text-slate-600 max-w-lg mx-auto">
              Thank you, <span className="font-semibold text-slate-900">{formData.companyName}</span>. Your company and fleet information has been received.
            </p>
            
            <div className="my-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl text-left max-w-md mx-auto space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Company:</span>
                <span className="font-semibold text-slate-900">{formData.companyName}</span>
              </div>
              {formData.contactPerson && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span>{formData.contactPerson}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span>{formData.phone}</span>
              </div>
              {formData.unitNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Initial Unit:</span>
                  <span className="font-semibold text-blue-600">Unit #{formData.unitNumber}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Status:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                  <ShieldCheck className="h-4 w-4" /> Pending Shop Approval
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Our service department is reviewing your details and will activate your account. If you have immediate roadside assistance needs, please call our dispatch directly.
            </p>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    companyName: "",
                    contactPerson: "",
                    phone: "",
                    email: "",
                    billingAddress: "",
                    serviceAddress: "",
                    sameAddress: true,
                    usdot: "",
                    mcNumber: "",
                    ein: "",
                    notes: "",
                    unitNumber: "",
                    vin: "",
                    year: "",
                    make: "",
                    model: "",
                    licensePlate: "",
                  });
                }}
                className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
              >
                Submit Another Registration
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Company & Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Company & Contact Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Company / Carrier Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Eagle Logistics LLC"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="(555) 000-0000"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address (For Invoices & Receipts)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="billing@yourcompany.com"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Addresses */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Address Information</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Billing Address
                </label>
                <input
                  type="text"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleChange}
                  placeholder="Street, City, State, ZIP"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sameAddress"
                  checked={formData.sameAddress}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="sameAddress" className="text-sm text-slate-700 select-none cursor-pointer">
                  Service / Physical address is the same as billing address
                </label>
              </div>

              {!formData.sameAddress && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Physical / Terminal Address
                  </label>
                  <input
                    type="text"
                    name="serviceAddress"
                    value={formData.serviceAddress}
                    onChange={handleChange}
                    placeholder="Street, City, State, ZIP"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Section 3: DOT & Business Credentials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">DOT & Business Identifiers</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    USDOT Number
                  </label>
                  <input
                    type="text"
                    name="usdot"
                    value={formData.usdot}
                    onChange={handleChange}
                    placeholder="e.g. 1234567"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    MC / ICC Number
                  </label>
                  <input
                    type="text"
                    name="mcNumber"
                    value={formData.mcNumber}
                    onChange={handleChange}
                    placeholder="e.g. MC-987654"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    EIN / Tax ID
                  </label>
                  <input
                    type="text"
                    name="ein"
                    value={formData.ein}
                    onChange={handleChange}
                    placeholder="XX-XXXXXXX"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Initial Truck Information */}
            <div className="space-y-4 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
              <div className="flex items-center justify-between pb-3 border-b border-blue-200 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900">Vehicle / Equipment Details</h3>
                </div>
                <div className="flex items-center gap-2">
                  <AiVinScanner
                    buttonLabel="📷 Scan VIN Photo with AI"
                    onScanComplete={(data) => {
                      setFormData((prev) => ({
                        ...prev,
                        vin: data.vin || prev.vin,
                        unitNumber: data.unitNumber || prev.unitNumber,
                        year: data.year ? String(data.year) : prev.year,
                        make: data.make || prev.make,
                        model: data.model || prev.model,
                        licensePlate: data.licensePlate || prev.licensePlate,
                      }));
                    }}
                  />
                  <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">Optional</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Add your truck or trailer specs so we have your vehicle ready in our dispatch system. You can type it or take a photo of the VIN sticker above!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Unit Number
                  </label>
                  <input
                    type="text"
                    name="unitNumber"
                    value={formData.unitNumber}
                    onChange={handleChange}
                    placeholder="e.g. Unit 105"
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    VIN (17 Characters)
                  </label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    placeholder="1FD..."
                    maxLength={17}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 uppercase font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Year
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="2022"
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Make
                  </label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    placeholder="Freightliner / Kenworth"
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Cascadia / T680"
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    License Plate & State
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder="e.g. ABC-1234 (TX)"
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Additional Notes */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Additional Notes or Service Requests
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special billing instructions, preferred driver contact, or current mechanical issues..."
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-sm resize-y"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-blue-600/30 transition duration-150 disabled:opacity-60 text-lg cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Submit Onboarding Registration</span>
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Your information is safely transmitted and encrypted for shop account creation.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
