"use client";

import { useState, useEffect } from "react";
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  Trash2, 
  Pencil, 
  X, 
  AlertCircle,
  TrendingDown,
  PieChart
} from "lucide-react";
import { API_URL } from "@/lib/config";

const EXPENSE_CATEGORIES = [
  "Rent & Lease",
  "Payroll & Labor",
  "Utilities (Electric/Water)",
  "Fuel & Gas",
  "Shop Insurance",
  "Tools & Shop Equipment",
  "Taxes & Licenses",
  "Advertising & Marketing",
  "Shop Supplies",
  "Software & Subscriptions",
  "Bank & Processing Fees",
  "Other Expenses"
];

interface Expense {
  id: string;
  expenseCategory: string;
  amount: number;
  date: string;
  description: string | null;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Log Expense Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const [formCategory, setFormCategory] = useState("Rent & Lease");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const url = new URL(`${API_URL}/api/expenses`);
      if (selectedCategory !== "ALL") {
        url.searchParams.set("category", selectedCategory);
      }
      if (searchQuery.trim()) {
        url.searchParams.set("search", searchQuery.trim());
      }

      const [listRes, summaryRes] = await Promise.all([
        fetch(url.toString()),
        fetch(`${API_URL}/api/expenses/summary`).catch(() => null)
      ]);

      if (!listRes.ok) throw new Error("Failed to load expenses");
      const listData = await listRes.json();
      setExpenses(listData.expenses || []);
      setTotalAmount(listData.totalAmount || 0);

      if (summaryRes && summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setCategoryBreakdown(summaryData.categoryBreakdown || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingExpenseId("");
    setFormCategory("Rent & Lease");
    setFormAmount("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEditModal = (exp: Expense) => {
    setModalMode("edit");
    setEditingExpenseId(exp.id);
    setFormCategory(exp.expenseCategory || "Other Expenses");
    setFormAmount(exp.amount?.toString() || "");
    setFormDate(exp.date ? new Date(exp.date).toISOString().split("T")[0] : "");
    setFormDescription(exp.description || "");
    setModalError("");
    setShowModal(true);
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setModalError("Please enter a valid positive amount");
      return;
    }

    setSubmitting(true);
    setModalError("");

    try {
      const payload = {
        expenseCategory: formCategory,
        amount: amountNum,
        date: formDate,
        description: formDescription.trim() || null
      };

      const url = modalMode === "create" 
        ? `${API_URL}/api/expenses`
        : `${API_URL}/api/expenses/${editingExpenseId}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save expense");
      }

      setShowModal(false);
      fetchExpenses();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete expense");
      fetchExpenses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Receipt className="h-7 w-7 text-blue-600" />
            Operating Expenses
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Track shop overhead costs, rent, payroll, utilities, and tax write-offs.</p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 text-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          Log Expense
        </button>
      </div>

      {/* Summary KPI & Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Expenses Banner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between md:col-span-1">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Expenses</span>
            <div className="text-2xl md:text-3xl font-extrabold text-rose-600 mt-1">
              ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{expenses.length} expense entries</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>

        {/* Top Spending Categories */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <PieChart className="h-3.5 w-3.5 text-blue-600" /> Spending by Category
          </span>
          {categoryBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">No categorized expenses recorded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {categoryBreakdown.slice(0, 6).map((cat) => (
                <div key={cat.category} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-700 truncate">{cat.category}</div>
                  <div className="text-xs font-extrabold text-slate-900 mt-0.5">${cat.amount.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400">{cat.percentage}% of total</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Categories
            </button>
            {EXPENSE_CATEGORIES.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </form>
        </div>

        {/* Expenses Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading expenses...</div>
        ) : error ? (
          <div className="py-8 text-center text-rose-500 text-sm flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No expenses found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== "ALL"
                ? "No expenses matched your filter."
                : "Log your first overhead expense (Rent, Payroll, Utilities) to begin tracking shop costs."}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Log First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Description / Payee</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {exp.expenseCategory}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-900 font-medium max-w-xs truncate">
                      {exp.description || "—"}
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                      ${Number(exp.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(exp)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log / Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                {modalMode === "create" ? "Log Operating Expense" : "Edit Expense Record"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount ($) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Payee (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. CenterPoint Energy (Electric Bill) or Monthly Bay Rent"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : (modalMode === "create" ? "Log Expense" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
