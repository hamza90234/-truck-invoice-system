"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Pencil, Trash2, Phone, Mail, MapPin, Truck, FileText, MoreVertical, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { API_URL } from "@/lib/config";
import { apiFetch } from "@/lib/api";

export default function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Approval / Rejection states
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/customers/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Customer not found");
          throw new Error("Failed to fetch customer details");
        }
        const data = await res.json();
        setCustomer(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      const res = await apiFetch(`${API_URL}/api/customers/${id}/approve`, {
        method: "PATCH"
      });
      if (!res.ok) throw new Error("Failed to approve customer");
      const updated = await res.json();
      setCustomer((prev: any) => ({ ...prev, status: "APPROVED", rejectionReason: null }));
      setActionSuccess("Customer approved successfully! Account is now active for billing.");
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      const res = await apiFetch(`${API_URL}/api/customers/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason.trim() })
      });
      if (!res.ok) throw new Error("Failed to reject customer");
      setCustomer((prev: any) => ({ 
        ...prev, 
        status: "REJECTED", 
        rejectionReason: rejectionReason.trim() || "Application rejected by shop administrator" 
      }));
      setShowRejectModal(false);
      setActionSuccess("Customer registration marked as rejected.");
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const res = await apiFetch(`${API_URL}/api/customers/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete customer");
      }
      
      router.push("/customers");
    } catch (err: any) {
      alert(err.message);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 text-center mt-12">
        <div className="text-red-600 mb-4">{error || "Customer not found"}</div>
        <Link href="/customers" className="text-blue-600 hover:underline">Return to Customer List</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-8 bg-slate-50 min-h-screen">
      
      {/* Native Mobile Header (Sticky) */}
      <div className="sticky top-0 z-20 bg-white md:bg-slate-50 border-b border-slate-200 md:border-none px-4 py-3 md:py-6 flex items-center justify-between">
        <Link href="/customers" className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="h-5 w-5 md:h-4 md:w-4 mr-1 md:text-slate-500" />
          <span className="hidden md:inline text-slate-500 text-sm hover:text-slate-900">Back to Customers</span>
          <span className="md:hidden">Customers</span>
        </Link>

        <h1 className="md:hidden font-semibold text-slate-900 text-base truncate mx-4 flex-1 text-center">
          {customer.companyName}
        </h1>

        <div className="relative">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              href={`/customers/${id}/edit`}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-slate-300 hover:border-red-200 font-medium px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>

          {/* Mobile Actions Menu */}
          <button 
            className="md:hidden p-2 -mr-2 text-blue-600"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showMobileMenu && (
            <div className="md:hidden absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1">
              <Link 
                href={`/customers/${id}/edit`}
                className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 active:bg-slate-100"
              >
                <Pencil className="h-4 w-4" />
                <span>Edit Customer</span>
              </Link>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 active:bg-red-100 text-left"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Customer</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="md:px-8">
        {/* Action Success Toast */}
        {actionSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-semibold animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Pending Review Banner */}
        {customer.status === "PENDING" && (
          <div className="mb-6 p-5 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                  <Clock className="h-3.5 w-3.5" />
                  Pending Self-Onboarding Application
                </div>
                <h3 className="text-lg font-bold text-slate-900">Customer Registration Needs Review</h3>
                <p className="text-sm text-slate-600">
                  This customer submitted their information online. Review details, adjust payment terms if needed, and accept or reject.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href={`/customers/${id}/edit`}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-sm transition"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Info
                </Link>

                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={isRejecting || isApproving}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm rounded-xl border border-rose-200 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {isApproving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>Accept & Approve</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejected Banner */}
        {customer.status === "REJECTED" && (
          <div className="mb-6 p-4 sm:p-5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-rose-900">Application Rejected</div>
                <p className="text-xs text-rose-700 mt-0.5">
                  Reason: {customer.rejectionReason || "No specific reason provided."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-800 hover:bg-slate-100 font-semibold text-xs rounded-xl border border-slate-300 shadow-sm transition self-start sm:self-auto cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Re-Approve Customer
            </button>
          </div>
        )}

        {/* Desktop Profile Header (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{customer.companyName}</h1>
              {customer.status === "PENDING" && (
                <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded text-xs font-bold border border-amber-200">
                  Pending Approval
                </span>
              )}
              {customer.status === "REJECTED" && (
                <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded text-xs font-bold border border-rose-200">
                  Rejected
                </span>
              )}
              {customer.status === "APPROVED" && (
                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded text-xs font-bold border border-emerald-200">
                  Active
                </span>
              )}
            </div>
            <div className="flex items-center text-slate-500 mt-1 gap-3 text-sm">
              {customer.customerType && (
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium border border-slate-200">
                  {customer.customerType}
                </span>
              )}
              <span>Added {new Date(customer.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-6 mt-2 md:mt-0">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-1 space-y-2 md:space-y-6">
            
            {/* Contact Card */}
            <div className="bg-white md:border md:border-slate-200 md:rounded-2xl p-4 md:p-6 shadow-sm border-b border-slate-200">
              <h3 className="text-[13px] uppercase tracking-wider font-semibold text-slate-500 mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Contact Info
              </h3>
              
              <div className="space-y-4">
                {customer.contactPerson && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Primary Contact</div>
                    <div className="font-medium text-slate-900 text-[15px]">{customer.contactPerson}</div>
                  </div>
                )}
                
                {customer.phone && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Phone</div>
                    <a href={`tel:${customer.phone}`} className="flex items-center gap-2 font-medium text-blue-600 text-[15px] hover:underline">
                      <Phone className="h-4 w-4" />
                      {customer.phone}
                    </a>
                  </div>
                )}

                {customer.email && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Email</div>
                    <a href={`mailto:${customer.email}`} className="flex items-center gap-2 font-medium text-blue-600 text-[15px] hover:underline">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="break-all">{customer.email}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Business Credentials Card */}
            <div className="bg-white md:border md:border-slate-200 md:rounded-2xl p-4 md:p-6 shadow-sm border-b border-slate-200">
              <h3 className="text-[13px] uppercase tracking-wider font-semibold text-slate-500 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Business Details
              </h3>
              
              <div className="space-y-0 divide-y divide-slate-100">
                {customer.usdot && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-slate-500">USDOT</span>
                    <span className="font-medium text-slate-900">{customer.usdot}</span>
                  </div>
                )}
                {customer.mcNumber && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-slate-500">MC Number</span>
                    <span className="font-medium text-slate-900">{customer.mcNumber}</span>
                  </div>
                )}
                {customer.ein && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-slate-500">EIN / Tax ID</span>
                    <span className="font-medium text-slate-900">{customer.ein}</span>
                  </div>
                )}
                {customer.paymentTerms && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-slate-500">Terms</span>
                    <span className="font-medium text-slate-900">{customer.paymentTerms}</span>
                  </div>
                )}
                
                {!customer.usdot && !customer.mcNumber && !customer.ein && !customer.paymentTerms && (
                  <div className="py-3 text-sm text-slate-400 italic">No business identifiers provided.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Addresses, Vehicles, Invoices */}
          <div className="lg:col-span-2 space-y-2 md:space-y-6">
            
            {/* Addresses Card */}
            <div className="bg-white md:border md:border-slate-200 md:rounded-2xl p-4 md:p-6 shadow-sm border-b border-slate-200">
              <h3 className="text-[13px] uppercase tracking-wider font-semibold text-slate-500 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Locations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-slate-900 mb-1">Billing Address</div>
                  {customer.billingAddress ? (
                    <p className="text-slate-600 text-[15px] whitespace-pre-wrap leading-relaxed">{customer.billingAddress}</p>
                  ) : (
                    <p className="text-slate-400 text-sm italic">Not provided</p>
                  )}
                </div>
                
                <div>
                  <div className="text-sm font-medium text-slate-900 mb-1">Service Address</div>
                  {customer.serviceAddress ? (
                    <p className="text-slate-600 text-[15px] whitespace-pre-wrap leading-relaxed">{customer.serviceAddress}</p>
                  ) : (
                    <p className="text-slate-400 text-sm italic">Same as billing / Not provided</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Card */}
            {customer.notes && (
               <div className="bg-white md:border md:border-slate-200 md:rounded-2xl p-4 md:p-6 shadow-sm border-b border-slate-200">
                <h3 className="text-[13px] uppercase tracking-wider font-semibold text-slate-500 mb-4">Internal Notes</h3>
                <p className="text-slate-700 text-[15px] whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
              </div>
            )}

            {/* Vehicles Module */}
            <div className="bg-white md:border md:border-slate-200 md:rounded-2xl p-4 md:p-6 shadow-sm border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Vehicles
                </h3>
                <Link 
                  href={`/customers/${id}/vehicles/new`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  + Add Vehicle
                </Link>
              </div>

              {customer.vehicles && customer.vehicles.length > 0 ? (
                <div className="space-y-4">
                  {customer.vehicles.map((vehicle: any) => (
                    <div key={vehicle.id} className="border border-slate-100 rounded-xl p-4 hover:border-slate-300 transition-colors bg-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h4>
                          <div className="text-sm text-slate-500 mt-0.5">
                            Unit #{vehicle.unitNumber || "N/A"} • VIN: {vehicle.vin}
                          </div>
                        </div>
                        <Link 
                          href={`/customers/${id}/vehicles/${vehicle.id}/edit`}
                          className="text-slate-400 hover:text-blue-600 p-1"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
                        {vehicle.licensePlate && (
                          <div className="flex flex-col">
                            <span className="text-slate-400 text-xs uppercase tracking-wider">License</span>
                            <span className="text-slate-700 font-medium">{vehicle.licensePlate}</span>
                          </div>
                        )}
                        {vehicle.mileage && (
                          <div className="flex flex-col">
                            <span className="text-slate-400 text-xs uppercase tracking-wider">Mileage</span>
                            <span className="text-slate-700 font-medium">{vehicle.mileage.toLocaleString()} mi</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <p className="text-slate-500 text-sm">No vehicles added yet.</p>
                </div>
              )}
            </div>
            
            {/* Customer Invoices Module */}
            <div className="bg-white md:border md:border-slate-200 md:rounded-2xl p-4 md:p-6 shadow-sm border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Repair Invoices
                </h3>
                <Link 
                  href={`/invoices/new?customerId=${id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  + Create Invoice
                </Link>
              </div>

              {customer.invoices && customer.invoices.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {customer.invoices.map((inv: any) => (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm font-mono group-hover:text-blue-600">{inv.invoiceNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            inv.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                            inv.status === 'CLOSED' ? 'bg-slate-100 text-slate-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(inv.date).toLocaleDateString()}
                          {inv.vehicle ? ` • Unit #${inv.vehicle.unitNumber || inv.vehicle.make}` : ""}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">${Number(inv.totalAmount).toFixed(2)}</div>
                        {Number(inv.balance) > 0 ? (
                          <div className="text-xs font-semibold text-rose-600">Due: ${Number(inv.balance).toFixed(2)}</div>
                        ) : (
                          <div className="text-xs text-emerald-600 font-medium">Paid in Full</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <p className="text-slate-500 text-sm">No invoices created for this customer yet.</p>
                  <Link 
                    href={`/invoices/new?customerId=${id}`}
                    className="text-xs text-blue-600 font-semibold hover:underline mt-1 inline-block"
                  >
                    Create first invoice
                  </Link>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reject Application</h3>
                <p className="text-xs text-slate-500">This will mark the customer as rejected.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Reason for Rejection (Optional)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Duplicate registration, out of service area, invalid USDOT number..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isRejecting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isRejecting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
