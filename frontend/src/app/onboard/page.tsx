"use client";

import { useState, useEffect } from "react";
import { Building2, Truck, CheckCircle2, AlertCircle, Send, ShieldCheck, Mail, Disc, Check, Wrench } from "lucide-react";
import { API_URL } from "@/lib/config";
import AiVinScanner from "@/app/components/AiVinScanner";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","MX","CA-ON","CA-QC","CA-BC","CA-AB"
];

const TRUCK_COLORS = [
  "White", "Black", "Red", "Blue", "Silver", "Gray", "Yellow", "Green", "Orange", "Dark Blue", "Other"
];

const TRAILER_TYPES = [
  "Dry Van",
  "Reefer",
  "Flatbed",
  "Car Hauler",
  "Step Deck",
  "Lowboy",
  "Tanker",
  "Other"
];

const CUSTOMER_TYPES = [
  "Fleet / Commercial",
  "Owner Operator",
  "Broker / Freight",
  "Individual / Other"
];

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
    additionalEmails: "",
    customerType: "Fleet / Commercial",
    serviceType: "ROAD_SERVICE", // "IN_SHOP" or "ROAD_SERVICE"
    billingAddress: "",
    usdot: "",
    mcNumber: "",
    // Initial Vehicle details
    equipmentType: "TRUCK" as "TRUCK" | "TRAILER",
    unitNumber: "",
    vin: "",
    year: "",
    make: "",
    model: "",
    color: "White",
    trailerType: "Dry Van",
    licensePlate: "",
    licensePlateState: "CA",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.companyName.trim()) {
      setError("Please provide your Company / Carrier Name.");
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
        additionalEmails: formData.additionalEmails.trim(),
        customerType: formData.customerType,
        serviceType: formData.serviceType,
        billingAddress: formData.billingAddress.trim(),
        usdot: formData.usdot.trim(),
        mcNumber: formData.mcNumber.trim(),
        // Vehicle details
        equipmentType: formData.equipmentType,
        unitNumber: formData.unitNumber.trim(),
        vin: formData.vin.trim().toUpperCase(),
        year: formData.year.trim(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        color: formData.equipmentType === "TRUCK" ? formData.color : null,
        trailerType: formData.equipmentType === "TRAILER" ? formData.trailerType : null,
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        licensePlateState: formData.licensePlateState.trim().toUpperCase(),
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

  const isTruck = formData.equipmentType === "TRUCK";

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
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
            Welcome to <strong>{shop.shopName || "AJ Road Service & Repair"}</strong>. Complete this quick form to register your account for fast dispatch, mobile roadside repair, and consolidated electronic invoicing.
          </p>
        </div>

        {submitted ? (
          /* Confirmation Screen */
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-12 text-center animate-in fade-in duration-300">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 mb-6 shadow-sm">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Registration Received!
            </h2>
            
            <p className="text-slate-600 text-base max-w-md mx-auto mb-6">
              Thank you, <strong>{formData.companyName}</strong>. Your account registration has been submitted directly to our service desk.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto text-left text-sm space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Contact:</span>
                <span className="font-semibold text-slate-800">{formData.contactPerson || "Primary Contact"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-slate-800">{formData.phone}</span>
              </div>
              {formData.unitNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Equipment Registered:</span>
                  <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-mono">
                    Unit #{formData.unitNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Account Status:</span>
                <span className="font-bold text-blue-600 inline-flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Pending Shop Activation
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Our service department is reviewing your details. If you have immediate roadside emergency needs, please call dispatch directly.
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
                    additionalEmails: "",
                    customerType: "Fleet / Commercial",
                    serviceType: "ROAD_SERVICE",
                    billingAddress: "",
                    usdot: "",
                    mcNumber: "",
                    equipmentType: "TRUCK",
                    unitNumber: "",
                    vin: "",
                    year: "",
                    make: "",
                    model: "",
                    color: "White",
                    trailerType: "Dry Van",
                    licensePlate: "",
                    licensePlateState: "CA",
                  });
                }}
                className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
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

            {/* Section 1: Customer Type & Service Preference */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <Wrench className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Account Type & Service Preference</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Account Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="customerType"
                    value={formData.customerType}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition shadow-xs"
                  >
                    {CUSTOMER_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Service Type Option: In Shop vs Road Service */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Primary Service Preference <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, serviceType: "ROAD_SERVICE" })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                        formData.serviceType === "ROAD_SERVICE"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      🚨 Mobile Road Service
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, serviceType: "IN_SHOP" })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                        formData.serviceType === "IN_SHOP"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      🏬 In-Shop Repair
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Company & Contact */}
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
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs"
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
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs"
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
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Billing Email (Invoices & Receipts)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="billing@yourcompany.com"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs"
                  />
                </div>

                {/* Additional / Dispatch Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Additional Emails (Dispatch / Operations)
                  </label>
                  <input
                    type="text"
                    name="additionalEmails"
                    value={formData.additionalEmails}
                    onChange={handleChange}
                    placeholder="dispatch@yourcompany.com, fleet@yourcompany.com"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Billing Address
                  </label>
                  <input
                    type="text"
                    name="billingAddress"
                    value={formData.billingAddress}
                    onChange={handleChange}
                    placeholder="Street, City, State, ZIP"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: DOT & Carrier Authority */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Carrier Authority Identifiers (Optional)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs font-mono"
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
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Initial Equipment / Vehicle Details */}
            <div className="space-y-5 bg-amber-50/40 p-6 rounded-2xl border border-amber-200">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-amber-700" />
                  <h3 className="text-lg font-bold text-slate-900">Vehicle / Unit Details</h3>
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
                  <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">Optional</span>
                </div>
              </div>

              {/* Equipment Type Toggle: Truck vs Trailer */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Select Unit Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, equipmentType: "TRUCK" })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                      isTruck
                        ? "border-blue-600 bg-blue-50 text-blue-900 shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span>Truck / Tractor</span>
                    {isTruck && <Check className="h-4 w-4 ml-1 text-blue-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, equipmentType: "TRAILER" })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                      !isTruck
                        ? "border-purple-600 bg-purple-50 text-purple-900 shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Disc className="h-4 w-4 text-purple-600" />
                    <span>Trailer</span>
                    {!isTruck && <Check className="h-4 w-4 ml-1 text-purple-600" />}
                  </button>
                </div>
              </div>

              {/* Trailer Type Options if Trailer */}
              {!isTruck && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-950">
                    Trailer Type (Dry Van / Drive-In, Reefer, Car Hauler, etc.)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TRAILER_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, trailerType: type })}
                        className={`py-2 px-2.5 rounded-lg text-xs font-bold border text-center transition cursor-pointer ${
                          formData.trailerType === type
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Highlighted Unit Number */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Unit Number (Fleet #)
                  </label>
                  <input
                    type="text"
                    name="unitNumber"
                    value={formData.unitNumber}
                    onChange={handleChange}
                    placeholder="e.g. Unit 105"
                    className="w-full bg-white border-2 border-amber-300 text-slate-900 font-mono font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none transition shadow-xs"
                  />
                </div>

                {/* 17-Char VIN */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    VIN (17 Characters)
                  </label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    placeholder="17-character VIN"
                    maxLength={17}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 uppercase font-mono tracking-wider focus:ring-2 focus:ring-blue-500 outline-none transition shadow-xs"
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
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    {isTruck ? "Make" : "Trailer Manufacturer"}
                  </label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    placeholder={isTruck ? "Freightliner / Peterbilt" : "Great Dane / Utility"}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition shadow-xs"
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
                    placeholder={isTruck ? "Cascadia / 579" : "Champion / 4000D"}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition shadow-xs"
                  />
                </div>

                {/* Truck Color (For Trucks Only) */}
                {isTruck && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Truck Color
                    </label>
                    <select
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition shadow-xs text-sm"
                    >
                      {TRUCK_COLORS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* License Plate Number */}
                <div className={isTruck ? "sm:col-span-1" : "sm:col-span-2"}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    License Plate
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder="e.g. 9ABC123"
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 uppercase font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none transition shadow-xs"
                  />
                </div>

                {/* License Plate State */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Plate State
                  </label>
                  <select
                    name="licensePlateState"
                    value={formData.licensePlateState}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition shadow-xs text-sm"
                  >
                    {US_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
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
