"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, Save } from "lucide-react";
import { API_URL } from "@/lib/config";

export default function AddVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: customerId } = use(params);

  const [formData, setFormData] = useState({
    unitNumber: "",
    vin: "",
    year: "",
    make: "",
    model: "",
    engine: "",
    transmission: "",
    licensePlate: "",
    mileage: "",
    equipmentType: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, customerId })
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

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/customers/${customerId}`} className="text-slate-500 hover:text-slate-900 p-1 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg hidden md:block">
              <Truck className="h-4 w-4" />
            </div>
            <h1 className="font-semibold text-slate-900 text-lg">Add New Vehicle</h1>
          </div>
        </div>
        
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-70 text-sm"
        >
          {loading ? (
             <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="hidden md:inline">{loading ? "Saving..." : "Save Vehicle"}</span>
          <span className="md:hidden">{loading ? "..." : "Save"}</span>
        </button>
      </div>

      <div className="p-4 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Core Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">Primary Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">VIN (Required) *</label>
                <input
                  type="text"
                  name="vin"
                  required
                  value={formData.vin}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none uppercase"
                  placeholder="17-character VIN"
                  maxLength={17}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit Number</label>
                <input
                  type="text"
                  name="unitNumber"
                  value={formData.unitNumber}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  placeholder="e.g. 101, Truck-A"
                />
              </div>
            </div>
          </div>

          {/* Make / Model / Year */}
          <div>
             <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">Make & Model</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  placeholder="YYYY"
                  min="1980"
                  max={new Date().getFullYear() + 1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  placeholder="e.g. Freightliner, Volvo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  placeholder="e.g. Cascadia, VNL"
                />
              </div>
             </div>
          </div>

          {/* Specs */}
          <div>
             <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">Specifications</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Engine</label>
                <input
                  type="text"
                  name="engine"
                  value={formData.engine}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  placeholder="e.g. Cummins ISX15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Transmission</label>
                <input
                  type="text"
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  placeholder="e.g. Eaton Fuller 10-Speed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Equipment Type</label>
                <select
                  name="equipmentType"
                  value={formData.equipmentType}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white"
                >
                  <option value="">Select Type</option>
                  <option value="Tractor">Tractor / Day Cab</option>
                  <option value="Sleeper">Sleeper</option>
                  <option value="Dry Van">Dry Van Trailer</option>
                  <option value="Reefer">Reefer Trailer</option>
                  <option value="Flatbed">Flatbed Trailer</option>
                  <option value="Box Truck">Box Truck</option>
                  <option value="Other">Other</option>
                </select>
              </div>
             </div>
          </div>

          {/* Registration */}
          <div>
             <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">Current Status</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">License Plate</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mileage</label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  placeholder="e.g. 450000"
                />
              </div>
             </div>
          </div>
          
          <div className="pt-4 flex justify-end md:hidden">
            <button 
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg transition-colors shadow-sm disabled:opacity-70 text-base"
            >
              {loading ? "Saving..." : "Save Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
