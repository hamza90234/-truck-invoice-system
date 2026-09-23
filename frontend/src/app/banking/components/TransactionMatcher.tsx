"use client";

import { useState, useEffect } from "react";
import { Check, ArrowRight } from "lucide-react";

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  invoice: {
    invoiceNumber: string;
    customer: {
      companyName: string;
    }
  }
}

export default function TransactionMatcher() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingId, setMatchingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/banking/transactions/unmatched`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setPayments(data.unmatchedPayments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (transactionId: string, paymentId: string) => {
    setMatchingId(transactionId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/banking/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, paymentId })
      });

      if (res.ok) {
        // Remove the matched items from state
        setTransactions(txs => txs.filter(t => t.id !== transactionId));
        setPayments(pms => pms.filter(p => p.id !== paymentId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMatchingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500 animate-pulse">Loading transactions...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-900">Match Transactions</h2>
        <p className="text-sm text-slate-500">Link imported bank deposits to customer payments.</p>
      </div>

      <div className="p-6">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No unmatched bank transactions found.
          </div>
        ) : (
          <div className="space-y-6">
            {transactions.map(tx => (
              <div key={tx.id} className="border border-slate-200 rounded-lg p-4 flex flex-col lg:flex-row gap-6">
                
                {/* Bank Transaction */}
                <div className="flex-1 bg-slate-50 rounded p-4 border-l-4 border-slate-400">
                  <div className="text-xs font-semibold text-slate-500 mb-1">BANK STATEMENT</div>
                  <div className="text-sm font-medium">{new Date(tx.date).toLocaleDateString()}</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">${Number(tx.amount).toFixed(2)}</div>
                  <div className="text-sm text-slate-600 mt-2 line-clamp-2">{tx.description}</div>
                </div>

                <div className="flex items-center justify-center lg:px-4">
                  <ArrowRight className="text-slate-300 hidden lg:block h-6 w-6" />
                </div>

                {/* Suggested Payments */}
                <div className="flex-[2] space-y-3">
                  <div className="text-xs font-semibold text-slate-500">SUGGESTED PAYMENTS IN SYSTEM</div>
                  
                  {payments.length === 0 && (
                    <div className="text-sm text-slate-400 italic">No unmatched payments found in system.</div>
                  )}

                  {payments.map(payment => {
                    const isExactMatch = Number(payment.amount) === Number(tx.amount);
                    return (
                      <div 
                        key={payment.id} 
                        className={`flex items-center justify-between p-3 rounded border ${isExactMatch ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white'}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">${Number(payment.amount).toFixed(2)}</span>
                            {isExactMatch && <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">EXACT MATCH</span>}
                          </div>
                          <div className="text-sm text-slate-600">
                            {payment.invoice.customer.companyName} • {payment.invoice.invoiceNumber}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleMatch(tx.id, payment.id)}
                          disabled={matchingId === tx.id}
                          className={`px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors ${
                            isExactMatch 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {matchingId === tx.id ? "Matching..." : <><Check className="h-4 w-4" /> Match</>}
                        </button>
                      </div>
                    )
                  })}
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
