"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, Save, Disc, Check } from "lucide-react";
import { API_URL } from "@/lib/config";
import { apiFetch } from "@/lib/api";
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
  "Dump Trailer",
  "Other"
];

export default function AddVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: customerId } = use(params);

  const [formData, setFormData] = useState({
    equipmentType: "TRUCK" as "TRUCK" | "TRAILER",
    unitNumber: "",
    vin: "",
    year: "",
    make: "",
    model: "",
    color: "White",
    trailerType: "Dry Van",
    engine: "",
    transmission: "",
    licensePlate: "",
    licensePlateState: "CA",
    mileage: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [decodingVin, setDecodingVin] = useState(false);

  const handleDecodeVin = async () => {
    const vin = formData.vin.trim();
    if (vin.length !== 17) {
      setError("VIN must be exactly 17 characters long to decode.");
      return;
    }
    setDecodingVin(true);
    setError("");
    try {
      const res = await apiFetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
      if (!res.ok) throw new Error("Failed to contact VIN decoder service.");
      const data = await res.json();
      
      let make = "";
      let model = "";
      let year = "";
      
      if (data && data.Results) {
        data.Results.forEach((item: any) => {
          if (item.Variable === "Make" && item.Value) make = item.Value;
          if (item.Variable === "Model" && item.Value) model = item.Value;
          if (item.Variable === "Model Year" && item.Value) year = item.Value;
        });
      }
      
      if (!make && !year) {
        setError("Could not decode this VIN. Please enter details manually.");
      } else {
        setFormData(prev => ({
          ...prev,
          make: make || prev.make,
          model: model || prev.model,
          year: year || prev.year
        }));
      }
    } catch (err: any) {
      setError("Error decoding VIN. Please enter details manually.");
    } finally {
      setDecodingVin(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        customerId,
        vin: formData.vin.trim().toUpperCase(),
        unitNumber: formData.unitNumber.trim(),
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        licensePlateState: formData.licensePlateState.trim().toUpperCase(),
        // If trailer, omit truck specific fields
        ...(formData.equipmentType === "TRAILER" ? {
          engine: null,
          transmission: null,
          color: null,
          mileage: null
        } : {
          trailerType: null
        })
      };

      const res = await apiFetch(`${API_URL}/api/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add vehicle");
      }

      router.push(`/customers/${customerId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isTruck = formData.equipmentType === "TRUCK";

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link href={`/customers/${customerId}`} className="text-slate-500 hover:text-slate-900 p-1 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 text-amber-800 p-1.5 rounded-lg hidden md:block">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base md:text-lg">Register New Unit</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Add a commercial truck, tractor, or trailer to this customer</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl transition-colors shadow-sm disabled:opacity-70 text-sm"
        >
          {loading ? (
             <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="hidden md:inline">{loading ? "Saving..." : "Save Unit"}</span>
          <span className="md:hidden">{loading ? "..." : "Save"}</span>
        </button>
      </div>

      <div className="p-4 md:p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          
          {/* Equipment Category Selection: Truck / Tractor vs Trailer */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Equipment Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, equipmentType: "TRUCK" })}
                className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                  isTruck
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Truck className="h-5 w-5 text-blue-600" />
                <span>Truck / Tractor</span>
                {isTruck && <Check className="h-4 w-4 ml-1 text-blue-600" />}
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, equipmentType: "TRAILER" })}
                className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                  !isTruck
                    ? "border-purple-600 bg-purple-50/70 text-purple-900 shadow-xs ring-2 ring-purple-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Disc className="h-5 w-5 text-purple-600" />
                <span>Trailer</span>
                {!isTruck && <Check className="h-4 w-4 ml-1 text-purple-600" />}
              </button>
            </div>
          </div>

          {/* Primary Identification */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Unit Identification</span>
              <span className="text-xs font-normal text-slate-500">Unit Number & 17-Char VIN</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Unit Number with Bold Color Styling */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Unit Number <span className="text-xs text-slate-400 font-normal">(Fleet / Cab #)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 font-mono">
                      UNIT
                    </span>
                  </div>
                  <input
                    type="text"
                    name="unitNumber"
                    value={formData.unitNumber}
                    onChange={handleChange}
                    className="w-full pl-16 pr-3 py-2.5 border-2 border-amber-300 bg-amber-50/40 rounded-xl font-mono font-bold text-slate-900 text-base focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none placeholder:text-slate-400"
                    placeholder="e.g. 104, T-12, 502"
                  />
                </div>
              </div>

              {/* VIN with AI Scanner */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="block text-sm font-medium text-slate-700">
                    VIN (17 Characters) <span className="text-red-500">*</span>
                  </label>
                  <AiVinScanner
                    compact
                    buttonLabel="📷 Scan VIN with AI"
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
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="vin"
                    required
                    value={formData.vin}
                    onChange={handleChange}
                    className="flex-1 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none uppercase font-mono text-sm"
                    placeholder="17-character VIN"
                    maxLength={17}
                  />
                  <button
                    type="button"
                    onClick={handleDecodeVin}
                    disabled={decodingVin || formData.vin.length < 17}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                  >
                    {decodingVin ? "Decoding..." : "Decode"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Trailer Type if Trailer */}
          {!isTruck && (
            <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 space-y-3">
              <label className="block text-sm font-bold text-purple-950">
                Trailer Configuration / Body Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TRAILER_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, trailerType: type })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border text-center transition cursor-pointer ${
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

          {/* Make / Model / Year */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {isTruck ? "Truck Specifications" : "Trailer Manufacturer & Specs"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                  placeholder="e.g. 2022"
                  min="1970"
                  max={new Date().getFullYear() + 2}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isTruck ? "Make / Manufacturer" : "Trailer Manufacturer"}
                </label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                  placeholder={isTruck ? "Freightliner, Peterbilt, Kenworth, Volvo" : "Great Dane, Utility, Wabash, Fontaine"}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                  placeholder={isTruck ? "Cascadia, 579, T680, VNL" : "Champion, 4000D-X, DuraPlate"}
                />
              </div>
            </div>

            {/* Truck-Only Fields: Color, Engine, Transmission, Odometer */}
            {isTruck && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                {/* Unit Color for Trucks Only */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Truck Color <span className="text-[10px] text-blue-600 font-bold">(Trucks Only)</span>
                  </label>
                  <select
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    {TRUCK_COLORS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Engine</label>
                  <input
                    type="text"
                    name="engine"
                    value={formData.engine}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="e.g. DD15, ISX15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transmission</label>
                  <input
                    type="text"
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="e.g. DT12, 10-Speed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Mileage</label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                    placeholder="e.g. 450000"
                  />
                </div>
              </div>
            )}
          </div>

          {/* License Plate & State */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              License Plate & Registration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">License Plate Number</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-xl uppercase font-mono font-bold text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="e.g. 9ABC123"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  License Plate State <span className="text-red-500">*</span>
                </label>
                <select
                  name="licensePlateState"
                  value={formData.licensePlateState}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end md:hidden">
            <button 
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-xl transition-colors shadow-sm disabled:opacity-70 text-base"
            >
              {loading ? "Saving..." : "Save Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
