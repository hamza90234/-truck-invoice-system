"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Truck, ChevronDown, Check, Plus, X, AlertTriangle } from "lucide-react";

export interface VehicleOption {
  id: string;
  customerId?: string;
  unitNumber: string | null;
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  licensePlate?: string | null;
  licensePlateState?: string | null;
  color?: string | null;
  equipmentType?: string | null;
  trailerType?: string | null;
  mileage?: number | null;
}

interface SearchableVehicleSelectProps {
  vehicles: any[];
  selectedVehicleId: string;
  onSelectVehicle: (vehicle: any) => void;
  onAddNewVehicle?: () => void;
  disabled?: boolean;
  customerId?: string;
}

export default function SearchableVehicleSelect({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  onAddNewVehicle,
  disabled = false,
  customerId
}: SearchableVehicleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return vehicles;

    return vehicles.filter((v) => {
      const unit = (v.unitNumber || "").toLowerCase();
      const vin = (v.vin || "").toLowerCase();
      const make = (v.make || "").toLowerCase();
      const model = (v.model || "").toLowerCase();
      const plate = (v.licensePlate || "").toLowerCase();
      const eq = (v.equipmentType || "").toLowerCase();
      const trailer = (v.trailerType || "").toLowerCase();

      return (
        unit.includes(q) ||
        vin.includes(q) ||
        make.includes(q) ||
        model.includes(q) ||
        plate.includes(q) ||
        eq.includes(q) ||
        trailer.includes(q)
      );
    });
  }, [vehicles, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (vehicle: VehicleOption) => {
    onSelectVehicle(vehicle);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectVehicle(null);
  };

  const isTrailer = (v: VehicleOption) => {
    return v.equipmentType?.toUpperCase() === "TRAILER" || Boolean(v.trailerType);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
          disabled
            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-sm"
            : selectedVehicle
            ? "bg-amber-50/50 border-amber-300 hover:border-amber-400 shadow-xs"
            : "bg-slate-50 border-slate-300 hover:bg-white focus:bg-white"
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Truck className="h-4 w-4" />
          </div>

          {selectedVehicle ? (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Standout Unit Number Badge */}
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-mono font-black text-xs sm:text-sm border border-amber-500 shadow-xs">
                  UNIT #{selectedVehicle.unitNumber || "N/A"}
                </span>

                <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                  {selectedVehicle.year || ""} {selectedVehicle.make || ""} {selectedVehicle.model || ""}
                </span>

                {isTrailer(selectedVehicle) ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    {selectedVehicle.trailerType || "Trailer"}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Truck
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1 truncate">
                <span className="font-mono text-slate-400">VIN: <span className="text-slate-600">{selectedVehicle.vin}</span></span>
                {selectedVehicle.licensePlate && (
                  <span className="inline-flex items-center gap-1 bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                    Plate: <strong className="text-slate-900">{selectedVehicle.licensePlate}</strong> {selectedVehicle.licensePlateState ? `(${selectedVehicle.licensePlateState})` : "(CA)"}
                  </span>
                )}
                {selectedVehicle.color && (
                  <span>Color: {selectedVehicle.color}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs sm:text-sm font-medium">
              {!customerId 
                ? "Select a customer first to load vehicles" 
                : vehicles.length === 0
                ? "No vehicles registered for this customer"
                : "Search and select truck or trailer unit..."}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedVehicle && !disabled && (
            <div
              role="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-200/80 rounded-md text-slate-400 hover:text-slate-600 transition"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </div>
          )}
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${
              isOpen ? "rotate-180 text-blue-600" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu / Bottom Sheet */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-x-auto sm:top-full sm:bottom-auto sm:left-0 sm:right-0 sm:mt-1.5 z-50 bg-white sm:rounded-2xl rounded-t-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[380px] flex flex-col animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-2 duration-150">
            {/* Mobile Grab Handle */}
            <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 shrink-0" />

            {/* Header / Search Input */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type Unit#, VIN, Make, Model, or Plate..."
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Vehicle List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-[280px]">
              {filteredVehicles.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-medium">No vehicles matching &ldquo;{searchQuery}&rdquo;</p>
                  {onAddNewVehicle && customerId && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onAddNewVehicle();
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add New Vehicle to Customer
                    </button>
                  )}
                </div>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const isSelected = vehicle.id === selectedVehicleId;
                  const trailer = isTrailer(vehicle);

                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => handleSelect(vehicle)}
                      className={`w-full p-3 text-left flex items-center justify-between gap-3 hover:bg-amber-50/60 active:bg-amber-100/60 transition cursor-pointer ${
                        isSelected ? "bg-amber-50/90 font-medium" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Unit Number Badge with Vibrant Golden Styling */}
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-mono font-black text-xs sm:text-sm border border-amber-500 shadow-xs">
                            UNIT #{vehicle.unitNumber || "N/A"}
                          </span>

                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {vehicle.year || ""} {vehicle.make || ""} {vehicle.model || ""}
                          </span>

                          {trailer ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                              {vehicle.trailerType || "Trailer"}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              Truck
                            </span>
                          )}

                          {vehicle.color && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              {vehicle.color}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="font-mono text-slate-400">VIN: <span className="text-slate-600">{vehicle.vin}</span></span>
                          {vehicle.licensePlate && (
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                              Plate: <strong className="text-slate-900">{vehicle.licensePlate}</strong> {vehicle.licensePlateState ? `(${vehicle.licensePlateState})` : "(CA)"}
                            </span>
                          )}
                          {vehicle.mileage ? (
                            <span className="text-slate-500">{vehicle.mileage.toLocaleString()} mi</span>
                          ) : null}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick Add Action Footer */}
            {onAddNewVehicle && customerId && (
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 pl-1">
                  {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} on file
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNewVehicle();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  + New Vehicle
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
