"use client";

import { useState, useEffect } from "react";
import { Upload, Landmark, CheckCircle, AlertCircle } from "lucide-react";
import TransactionMatcher from "./components/TransactionMatcher";

export default function BankingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/banking/upload`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header, let browser set it with boundary
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        setFile(null);
        setRefreshKey((k) => k + 1); // trigger refresh of transactions
      } else {
        setMessage({ type: "error", text: data.error || "Upload failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error. Make sure backend is running." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Landmark className="h-6 w-6 text-blue-600" />
          Banking
        </h1>
        <p className="text-slate-500 mt-1">Import bank statements and match transactions to payments.</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Import Bank Statement (CSV)</h2>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              {file ? (
                <span className="font-semibold text-blue-600">{file.name}</span>
              ) : (
                "Click or drag CSV file to upload"
              )}
            </p>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="h-4 w-4" /> Upload Statement
              </>
            )}
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {message.text}
          </div>
        )}
      </div>

      {/* Transaction Matching Section */}
      <TransactionMatcher key={refreshKey} />
      
    </div>
  );
}
