"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  Wrench, 
  Package, 
  Truck, 
  Building2, 
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  X
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import SearchableCustomerSelect from "@/app/components/SearchableCustomerSelect";
import SearchablePartSelect from "@/app/components/SearchablePartSelect";
import SearchableVehicleSelect from "@/app/components/SearchableVehicleSelect";
import AiVinScanner from "@/app/components/AiVinScanner";

interface CustomerOption {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  vehicles: VehicleOption[];
}

interface VehicleOption {
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

interface PartOption {
  id: string;
  partNumber: string;
  name: string;
  sellingPrice: number;
  purchaseCost?: number;
  stockQuantity: number;
}

interface LaborLine {
  id: string;
  description: string;
  quantity: string; // hours
  rate: string;     // hourly rate
}

interface PartLine {
  id: string;
  partId: string;
  description: string;
  quantity: string;
  rate: string;
  stockQuantity?: number;
}

function InvoiceCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId") || "";
  const preselectedVehicleId = searchParams.get("vehicleId") || "";

  // Data sources
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<VehicleOption[]>([]);
  const [partsCatalog, setPartsCatalog] = useState<PartOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Invoice header
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId);
  const [selectedVehicleId, setSelectedVehicleId] = useState(preselectedVehicleId);
  const [vehicleOdometer, setVehicleOdometer] = useState("");
  const [isEstimate, setIsEstimate] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [taxRate, setTaxRate] = useState("8.25");
  const [creditCardFeePct, setCreditCardFeePct] = useState(3.0);
  const [status, setStatus] = useState("UNPAID");
  const [notes, setNotes] = useState("");
  const [warrantyInfo, setWarrantyInfo] = useState("30-day labor and 90-day parts warranty from date of repair.");
  
  const [shopRate, setShopRate] = useState("120");
  const [roadRate, setRoadRate] = useState("150");

  // Quick Part Add Modal
  const [showPartModal, setShowPartModal] = useState(false);
  const [newPart, setNewPart] = useState({ partNumber: "", name: "", sellingPrice: "", purchaseCost: "", stockQuantity: "0", minimumStockLevel: "5" });
  const [savingPart, setSavingPart] = useState(false);
  const [partError, setPartError] = useState("");

  // Quick Customer Add Modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    additionalEmails: "",
    unitNumber: "",
    vin: ""
  });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerModalError, setCustomerModalError] = useState("");

  // Line items
  const [laborItems, setLaborItems] = useState<LaborLine[]>([
    { id: "labor-1", description: "Standard Diagnostic & Inspection", quantity: "1", rate: "120" }
  ]);
  const [partItems, setPartItems] = useState<PartLine[]>([]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoadingData(true);
        const [custRes, partsRes, nextNumRes, shopRes] = await Promise.all([
          apiFetch(`${API_URL}/api/customers?status=APPROVED`),
          apiFetch(`${API_URL}/api/parts`),
          apiFetch(`${API_URL}/api/invoices/next-number`),
          apiFetch(`${API_URL}/api/shop/profile`).catch(() => null)
        ]);

        if (custRes.ok) {
          const custList = await custRes.json();
          setCustomers(custList);

          if (preselectedCustomerId) {
            const found = custList.find((c: any) => c.id === preselectedCustomerId);
            if (found) {
              setAvailableVehicles(found.vehicles || []);
            }
          }
        }

        if (partsRes.ok) {
          const partsList = await partsRes.json();
          setPartsCatalog(partsList);
        }

        if (nextNumRes.ok) {
          const numData = await nextNumRes.json();
          setInvoiceNumber(numData.nextInvoiceNumber || "INV-1001");
        }

        if (shopRes && shopRes.ok) {
          const shopData = await shopRes.json();
          if (shopData.defaultTaxRate !== undefined && Number(shopData.defaultTaxRate) > 0) {
            setTaxRate(shopData.defaultTaxRate.toString());
          }
          if (shopData.defaultPaymentTerms) setPaymentTerms(shopData.defaultPaymentTerms);
          if (shopData.creditCardFeePct !== undefined) setCreditCardFeePct(Number(shopData.creditCardFeePct));
          
          if (shopData.invoiceSettings) {
            try {
              const parsed = JSON.parse(shopData.invoiceSettings);
              if (parsed.defaultCustomerNote) setNotes(parsed.defaultCustomerNote);
              if (parsed.defaultWarranty) setWarrantyInfo(parsed.defaultWarranty);
              if (parsed.defaultLaborRateShop) {
                setShopRate(parsed.defaultLaborRateShop.toString());
                setLaborItems([
                  { id: "labor-1", description: "Shop Service", quantity: "1", rate: parsed.defaultLaborRateShop.toString() }
                ]);
              }
              if (parsed.defaultLaborRateRoad) setRoadRate(parsed.defaultLaborRateRoad.toString());
            } catch (e) {
              setWarrantyInfo(shopData.invoiceSettings);
            }
          }
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to initialize invoice form data.");
      } finally {
        setLoadingData(false);
      }
    };

    initializeData();
  }, [preselectedCustomerId]);

  const handleQuickAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPart(true);
    setPartError("");
    try {
      const res = await apiFetch(`${API_URL}/api/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPart,
          sellingPrice: parseFloat(newPart.sellingPrice) || 0,
          purchaseCost: parseFloat(newPart.purchaseCost) || 0,
          stockQuantity: parseInt(newPart.stockQuantity, 10) || 0,
          minimumStockLevel: parseInt(newPart.minimumStockLevel, 10) || 0,
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create part");
      }
      const createdPart = await res.json();
      
      // Update parts catalog directly
      setPartsCatalog([...partsCatalog, createdPart]);
      
      setShowPartModal(false);
      
      // Auto-add it to the invoice lines
      const newRowId = `part-${Date.now()}`;
      setPartItems([...partItems, {
        id: newRowId,
        partId: createdPart.id,
        description: `[${createdPart.partNumber}] ${createdPart.name}`,
        quantity: "1",
        rate: createdPart.sellingPrice.toString(),
        stockQuantity: createdPart.stockQuantity
      }]);
      setNewPart({ partNumber: "", name: "", sellingPrice: "", purchaseCost: "", stockQuantity: "0", minimumStockLevel: "5" });
    } catch (err: any) {
      setPartError(err.message);
    } finally {
      setSavingPart(false);
    }
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerModalError("");
    setSavingCustomer(true);
    try {
      if (!newCustomerData.companyName.trim()) {
        throw new Error("Company Name is required");
      }

      const custRes = await apiFetch(`${API_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: newCustomerData.companyName.trim(),
          contactPerson: newCustomerData.contactPerson.trim() || null,
          phone: newCustomerData.phone.trim() || null,
          email: newCustomerData.email.trim() || null,
          additionalEmails: newCustomerData.additionalEmails?.trim() || null,
        }),
      });

      if (!custRes.ok) {
        const d = await custRes.json();
        throw new Error(d.error || "Failed to create customer");
      }

      const createdCust = await custRes.json();

      let createdVeh: VehicleOption | null = null;
      if (newCustomerData.unitNumber.trim() || newCustomerData.vin.trim()) {
        try {
          const vehRes = await apiFetch(`${API_URL}/api/vehicles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerId: createdCust.id,
              unitNumber: newCustomerData.unitNumber.trim() || null,
              vin: newCustomerData.vin.trim() || `UNIT-${Date.now()}`,
            }),
          });
          if (vehRes.ok) {
            createdVeh = await vehRes.json();
          }
        } catch (vErr) {
          console.warn("Vehicle creation notice:", vErr);
        }
      }

      const fullCustomer: CustomerOption = {
        id: createdCust.id,
        companyName: createdCust.companyName,
        contactPerson: createdCust.contactPerson,
        phone: createdCust.phone,
        vehicles: createdVeh ? [createdVeh] : [],
      };

      setCustomers((prev) => [fullCustomer, ...prev]);
      handleCustomerChange(fullCustomer.id);
      setShowCustomerModal(false);
      setNewCustomerData({
        companyName: "",
        contactPerson: "",
        phone: "",
        email: "",
        additionalEmails: "",
        unitNumber: "",
        vin: "",
      });
    } catch (err: any) {
      setCustomerModalError(err.message);
    } finally {
      setSavingCustomer(false);
    }
  };

  // When customer changes, update available vehicles
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const found = customers.find(c => c.id === customerId);
    if (found) {
      setAvailableVehicles(found.vehicles);
      setAvailableVehicles(found.vehicles);
      if (found.vehicles.length === 1) {
        setSelectedVehicleId(found.vehicles[0].id);
        setVehicleOdometer(found.vehicles[0].mileage?.toString() || "");
      } else {
        setSelectedVehicleId("");
        setVehicleOdometer("");
      }
    } else {
      setAvailableVehicles([]);
      setSelectedVehicleId("");
    }
  };

  // Labor Row Actions
  const addLaborRow = (type: 'shop' | 'road') => {
    setLaborItems([
      ...laborItems,
      { 
        id: `labor-${Date.now()}`, 
        description: type === 'shop' ? "Shop Service" : "Road Service", 
        quantity: "1", 
        rate: type === 'shop' ? shopRate : roadRate 
      }
    ]);
  };

  const updateLaborRow = (id: string, field: keyof LaborLine, val: string) => {
    setLaborItems(laborItems.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const removeLaborRow = (id: string) => {
    if (laborItems.length === 1) {
      setLaborItems([{ id: `labor-${Date.now()}`, description: "", quantity: "", rate: "" }]);
    } else {
      setLaborItems(laborItems.filter(item => item.id !== id));
    }
  };

  // Parts Row Actions
  const addPartRow = () => {
    setPartItems([
      ...partItems,
      { id: `part-${Date.now()}`, partId: "", description: "", quantity: "1", rate: "0" }
    ]);
  };

  const selectPartFromCatalog = (id: string, partId: string) => {
    if (!partId) {
      setPartItems(partItems.map(item => item.id === id ? { ...item, partId: "", description: "", rate: "0", stockQuantity: undefined } : item));
      return;
    }

    const selected = partsCatalog.find(p => p.id === partId);
    if (selected) {
      setPartItems(partItems.map(item => item.id === id ? {
        ...item,
        partId: selected.id,
        description: `[${selected.partNumber}] ${selected.name}`,
        rate: selected.sellingPrice.toString(),
        stockQuantity: selected.stockQuantity
      } : item));
    }
  };

  const updatePartRow = (id: string, field: keyof PartLine, val: string) => {
    setPartItems(partItems.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const removePartRow = (id: string) => {
    setPartItems(partItems.filter(item => item.id !== id));
  };

  // Calculations
  const laborSubtotal = laborItems.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return acc + (qty * rate);
  }, 0);

  const partsSubtotal = partItems.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return acc + (qty * rate);
  }, 0);

  const subtotal = laborSubtotal + partsSubtotal;
  const taxRateNum = parseFloat(taxRate) || 0;
  // Apply tax ONLY to parts
  const taxAmount = (partsSubtotal * taxRateNum) / 100;
  const totalAmount = subtotal + taxAmount;
  const cardFeePreview = (totalAmount * (creditCardFeePct || 3)) / 100;

  // Real-time Profit Preview for Shop Owner
  const partsCostPreview = partItems.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const catalogItem = partsCatalog.find(p => p.id === item.partId);
    const unitCost = catalogItem ? Number(catalogItem.purchaseCost || 0) : 0;
    return acc + (qty * unitCost);
  }, 0);
  const partsProfitPreview = Math.max(0, partsSubtotal - partsCostPreview);
  const totalProfitPreview = laborSubtotal + partsProfitPreview;
  const marginPctPreview = subtotal > 0 ? ((totalProfitPreview / subtotal) * 100).toFixed(1) : "0.0";

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError("Please select a Customer for this invoice.");
      return;
    }
    if (!selectedVehicleId) {
      setError("Please select a Vehicle for this invoice.");
      return;
    }

    // Filter valid line items
    const validLabor = laborItems
      .filter(l => l.description.trim() !== "" && (parseFloat(l.quantity) || 0) > 0)
      .map(l => ({
        type: "LABOR",
        description: l.description.trim(),
        quantity: parseFloat(l.quantity) || 1,
        rate: parseFloat(l.rate) || 0
      }));

    const validParts = partItems
      .filter(p => p.description.trim() !== "" && (parseFloat(p.quantity) || 0) > 0)
      .map(p => ({
        type: "PART",
        partId: p.partId || null,
        description: p.description.trim(),
        quantity: parseFloat(p.quantity) || 1,
        rate: parseFloat(p.rate) || 0
      }));

    if (validLabor.length === 0 && validParts.length === 0) {
      setError("Please add at least one Labor or Part line item.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId,
        invoiceNumber: invoiceNumber.trim(),
        date: invoiceDate,
        dueDate: dueDate || null,
        paymentTerms,
        vehicleOdometer: vehicleOdometer ? vehicleOdometer.trim() : null,
        taxRate: taxRateNum,
        isEstimate,
        status: isEstimate ? "DRAFT" : status,
        notes,
        warrantyInfo,
        items: [...validLabor, ...validParts]
      };

      const res = await apiFetch(`${API_URL}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errMsg = "Failed to create invoice";
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      const created = await res.json();
      router.push(`/invoices/${created.id}`);
    } catch (err: any) {
      const message = err.message === "Failed to fetch"
        ? "Unable to reach the server. Please verify your backend server is running on port 5000."
        : (err.message || "An unexpected error occurred.");
      setError(message);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-12 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-3.5 sm:px-4 py-3 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/invoices" className="text-slate-500 hover:text-slate-900 p-1 -ml-1 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
              Create Invoice
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">Record repair work, parts used, and calculate billings</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setStatus("DRAFT")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
              status === "DRAFT" ? "bg-slate-900 text-white border-slate-900 shadow-xs" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            Draft
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-3 sm:px-4 py-1.5 rounded-xl text-[11px] sm:text-xs transition-colors shadow-xs disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 shrink-0" />
            <span>{saving ? "Saving..." : "Issue"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Customer & Vehicle */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="h-4 w-4 text-blue-600" />
            Customer & Vehicle Selection
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Account <span className="text-red-500">*</span>
              </label>
              <SearchableCustomerSelect
                customers={customers}
                value={selectedCustomerId}
                onChange={handleCustomerChange}
                onAddNewCustomer={() => setShowCustomerModal(true)}
                required
              />
              {customers.length === 0 && !loadingData && (
                <p className="text-[11px] text-amber-600 mt-1">
                  No customers found. <Link href="/customers/new" className="underline font-semibold">Add a customer first</Link>
                </p>
              )}
            </div>

            {/* Vehicle Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer&apos;s Vehicle / Truck Unit <span className="text-red-500">*</span>
              </label>
              <SearchableVehicleSelect
                vehicles={availableVehicles}
                selectedVehicleId={selectedVehicleId}
                customerId={selectedCustomerId}
                disabled={!selectedCustomerId}
                onSelectVehicle={(veh: any) => {
                  if (veh) {
                    setSelectedVehicleId(veh.id);
                    if (veh.mileage) setVehicleOdometer(veh.mileage.toString());
                  } else {
                    setSelectedVehicleId("");
                    setVehicleOdometer("");
                  }
                }}
                onAddNewVehicle={() => {
                  if (selectedCustomerId) {
                    router.push(`/customers/${selectedCustomerId}/vehicles/new`);
                  }
                }}
              />
              {selectedCustomerId && availableVehicles.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">
                  This customer has no vehicles. <Link href={`/customers/${selectedCustomerId}/vehicles/new`} className="underline font-semibold">Add a vehicle</Link>
                </p>
              )}
            </div>
          </div>

          {/* Odometer Input */}
          {selectedVehicleId && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Odometer / Mileage (Optional)
              </label>
              <input
                type="number"
                value={vehicleOdometer}
                onChange={(e) => setVehicleOdometer(e.target.value)}
                placeholder="e.g. 120500"
                className="w-full md:w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Section 2: Invoice Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Document Terms & Dates
            </h2>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={isEstimate}
                onChange={(e) => setIsEstimate(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-700">Save as Estimate</span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{isEstimate ? "Estimate Number" : "Invoice Number"}</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date (Optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Labor Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-600" />
              Labor / Service Performed
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addLaborRow('shop')}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Shop
              </button>
              <button
                type="button"
                onClick={() => addLaborRow('road')}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Road
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {laborItems.map((item, idx) => {
              const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
              return (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 bg-slate-50/70 p-3 sm:p-2.5 rounded-2xl sm:rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="e.g. Brake Pad Replacement & Rotor Resurfacing"
                      value={item.description}
                      onChange={(e) => updateLaborRow(item.id, "description", e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 sm:border-transparent">
                    <div className="w-20">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          placeholder="Hours"
                          value={item.quantity}
                          onChange={(e) => updateLaborRow(item.id, "quantity", e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-center font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block text-center mt-0.5">Hours</span>
                    </div>

                    <div className="w-24">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => updateLaborRow(item.id, "rate", e.target.value)}
                          className="w-full pl-6 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-right font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block text-right pr-1 mt-0.5">Rate/hr</span>
                    </div>

                    <div className="flex-1 sm:w-20 text-right pr-1">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        ${lineTotal.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400 block">Total</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeLaborRow(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 active:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove labor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-right text-xs font-semibold text-slate-600 pt-1">
            Labor Subtotal: <span className="text-slate-900 font-bold">${laborSubtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Section 4: Parts Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Parts & Materials
              </h2>
              <p className="text-[11px] text-slate-500">Pick from shop inventory or enter non-catalog parts</p>
            </div>
            <button
              type="button"
              onClick={addPartRow}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Part
            </button>
          </div>

          {partItems.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500">No parts added yet. Click &quot;Add Part&quot; to include parts on this invoice.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {partItems.map((item) => {
                const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
                const isOverStock = item.stockQuantity !== undefined && (parseFloat(item.quantity) || 0) > item.stockQuantity;

                return (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 bg-slate-50/70 p-3 sm:p-2.5 rounded-2xl sm:rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex-1 w-full space-y-2">
                      <SearchablePartSelect
                        parts={partsCatalog}
                        value={item.partId}
                        onChange={(partId) => selectPartFromCatalog(item.id, partId)}
                        onAddNewPart={() => setShowPartModal(true)}
                      />

                      <input
                        type="text"
                        placeholder="Part Description"
                        value={item.description}
                        onChange={(e) => updatePartRow(item.id, "description", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />

                      {isOverStock && (
                        <div className="text-[10px] text-amber-600 flex items-center gap-1 font-medium">
                          <AlertTriangle className="h-3 w-3" /> Quantity exceeds current stock ({item.stockQuantity} in stock)
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 sm:border-transparent">
                      <div className="w-20">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updatePartRow(item.id, "quantity", e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-center font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-[10px] text-slate-400 block text-center mt-0.5">Qty</span>
                      </div>

                      <div className="w-24">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Price"
                            value={item.rate}
                            onChange={(e) => updatePartRow(item.id, "rate", e.target.value)}
                            className="w-full pl-6 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-right font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block text-right pr-1 mt-0.5">Unit Price</span>
                      </div>

                      <div className="flex-1 sm:w-20 text-right pr-1">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          ${lineTotal.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400 block">Total</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removePartRow(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 active:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Remove part"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-right text-xs font-semibold text-slate-600 pt-1">
            Parts Subtotal: <span className="text-slate-900 font-bold">${partsSubtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Section 5: Summary Calculation & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes & Warranty */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Notes & Warranty
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Work Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes for customer (e.g. Recommended upcoming suspension inspection)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Statement</label>
              <textarea
                rows={2}
                value={warrantyInfo}
                onChange={(e) => setWarrantyInfo(e.target.value)}
                placeholder="Shop warranty terms appearing at bottom of invoice"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Totals Calculation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Invoice Summary
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Labor Subtotal:</span>
                <span className="font-semibold text-slate-800">${laborSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Parts Subtotal:</span>
                <span className="font-semibold text-slate-800">${partsSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-slate-100">
                <span>Total Pre-Tax Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {/* Tax Rate Input */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600">Tax Rate (%):</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-16 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-right font-medium"
                  />
                </div>
                <span className="font-semibold text-slate-800">${taxAmount.toFixed(2)}</span>
              </div>

              {/* Final Invoice Total */}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t-2 border-slate-200">
                <span>Invoice Total:</span>
                <span className="text-blue-600 text-lg">${totalAmount.toFixed(2)}</span>
              </div>

              {/* Credit Card Processing Fee Helper */}
              <div className="bg-blue-50/60 p-2.5 rounded-xl text-[11px] text-slate-500 flex items-start gap-1.5 mt-2">
                <HelpCircle className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  If customer pays via Credit Card with a {creditCardFeePct}% fee, the surcharge is <strong>${cardFeePreview.toFixed(2)}</strong> (Total: ${(totalAmount + cardFeePreview).toFixed(2)}).
                </span>
              </div>

              {/* Real-Time Profit Preview for Shop Owner */}
              <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl text-xs space-y-1.5 mt-3">
                <div className="flex items-center justify-between text-emerald-950 font-bold">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    Estimated Net Profit:
                  </span>
                  <span className="text-sm font-black text-emerald-800">
                    ${totalProfitPreview.toFixed(2)} ({marginPctPreview}%)
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700 flex justify-between pt-1 border-t border-emerald-200/60">
                  <span>Labor Profit (100%): <strong>${laborSubtotal.toFixed(2)}</strong></span>
                  <span>Parts Profit: <strong>+${partsProfitPreview.toFixed(2)}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/invoices"
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {saving ? "Creating Invoice..." : "Issue Repair Invoice"}
          </button>
        </div>
      </form>

      {/* Quick Add Customer Modal (Mobile-First) */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setShowCustomerModal(false)} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[85vh] z-10 animate-in slide-in-from-bottom-6 duration-200">
            {/* Drag Handle on Mobile */}
            <div className="pt-2.5 pb-1 sm:hidden flex justify-center bg-slate-50/80 shrink-0">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">Quick Add Customer</h3>
                  <p className="text-[11px] text-slate-500">Add account and start invoicing immediately</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleQuickAddCustomer} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {customerModalError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{customerModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Business Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Eagle Freight Logistics LLC"
                  value={newCustomerData.companyName}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. John Miller"
                    value={newCustomerData.contactPerson}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. (909) 555-0199"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Billing Email (Primary)</label>
                  <input
                    type="email"
                    placeholder="billing@company.com"
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Additional Emails (Dispatch/AP)</label>
                  <input
                    type="text"
                    placeholder="dispatch@company.com, ap@co.com"
                    value={newCustomerData.additionalEmails}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, additionalEmails: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                  />
                </div>
              </div>

              {/* Initial Vehicle (Optional) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-blue-600" />
                    Initial Vehicle / Truck Unit (Optional)
                  </span>
                  <AiVinScanner
                    compact
                    buttonLabel="📷 Scan VIN with AI"
                    onScanComplete={(data) => {
                      setNewCustomerData((prev) => ({
                        ...prev,
                        vin: data.vin || prev.vin,
                        unitNumber: data.unitNumber || prev.unitNumber,
                      }));
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Unit Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 104"
                      value={newCustomerData.unitNumber}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, unitNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">VIN (Last 6 or full)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1XKAD49X..."
                      value={newCustomerData.vin}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, vin: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {savingCustomer ? "Creating Customer..." : "Save & Select Customer"}
                </button>
              </div>
              <div className="h-6 sm:h-2" />
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Part Modal (Mobile-First) */}
      {showPartModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setShowPartModal(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[85vh] z-10 animate-in slide-in-from-bottom-6 duration-200">
            {/* Drag Handle on Mobile */}
            <div className="pt-2.5 pb-1 sm:hidden flex justify-center bg-slate-50/80 shrink-0">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">Add Part to Inventory</h3>
                  <p className="text-[11px] text-slate-500">Save to catalog and auto-add to this invoice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPartModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleQuickAddPart} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {partError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{partError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Part Number *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. BF-1280"
                    value={newPart.partNumber}
                    onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Part Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Fuel Water Separator"
                    value={newPart.name}
                    onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newPart.sellingPrice}
                      onChange={(e) => setNewPart({ ...newPart, sellingPrice: e.target.value })}
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newPart.purchaseCost}
                      onChange={(e) => setNewPart({ ...newPart, purchaseCost: e.target.value })}
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    step="1"
                    value={newPart.stockQuantity}
                    onChange={(e) => setNewPart({ ...newPart, stockQuantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-center"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPartModal(false)}
                  className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPart}
                  className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {savingPart ? "Saving Part..." : "Save & Add to Invoice"}
                </button>
              </div>
              <div className="h-6 sm:h-2" />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Loading invoice creator...</div>}>
      <InvoiceCreateForm />
    </Suspense>
  );
}
