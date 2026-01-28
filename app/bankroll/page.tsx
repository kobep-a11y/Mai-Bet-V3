'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BankrollSummary {
  currentBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  roi: number;
  winRate: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pushedBets: number;
}

interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  type: 'bet' | 'win' | 'loss' | 'push' | 'deposit' | 'withdrawal';
  amount: number;
  signalId?: string;
  strategyName?: string;
  runningBalance: number;
  notes?: string;
}

export default function BankrollPage() {
  const [summary, setSummary] = useState<BankrollSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBankrollData();
  }, []);

  const fetchBankrollData = async () => {
    try {
      const response = await fetch('/api/bankroll');
      const data = await response.json();
      setSummary(data.summary);
      setTransactions(data.recentTransactions || []);
    } catch (error) {
      console.error('Error fetching bankroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/bankroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deposit',
          amount,
          notes: depositNotes || undefined,
        }),
      });

      if (response.ok) {
        setShowDepositModal(false);
        setDepositAmount('');
        setDepositNotes('');
        fetchBankrollData();
      }
    } catch (error) {
      console.error('Error recording deposit:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'win':
        return 'bg-green-100 text-green-800';
      case 'loss':
        return 'bg-red-100 text-red-800';
      case 'bet':
        return 'bg-blue-100 text-blue-800';
      case 'deposit':
        return 'bg-purple-100 text-purple-800';
      case 'withdrawal':
        return 'bg-yellow-100 text-yellow-800';
      case 'push':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-400 hover:text-slate-600">
                ← Back
              </Link>
              <h1 className="text-2xl font-bold text-slate-800">💰 Bankroll</h1>
            </div>
            <button
              onClick={() => setShowDepositModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              + Add Funds
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Current Balance */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Current Balance</div>
            <div className="text-3xl font-bold text-slate-800">
              {formatCurrency(summary?.currentBalance || 0)}
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Net Profit/Loss</div>
            <div className={`text-3xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(summary?.netProfit || 0) >= 0 ? '+' : ''}{formatCurrency(summary?.netProfit || 0)}
            </div>
          </div>

          {/* ROI */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">ROI</div>
            <div className={`text-3xl font-bold ${(summary?.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(summary?.roi || 0) >= 0 ? '+' : ''}{(summary?.roi || 0).toFixed(1)}%
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Win Rate</div>
            <div className="text-3xl font-bold text-slate-800">
              {(summary?.winRate || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {summary?.wonBets || 0}W - {summary?.lostBets || 0}L - {summary?.pushedBets || 0}P
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="text-xs text-slate-500">Total Wagered</div>
            <div className="text-lg font-semibold text-slate-700">
              {formatCurrency(summary?.totalWagered || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="text-xs text-slate-500">Total Won</div>
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(summary?.totalWon || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="text-xs text-slate-500">Total Deposits</div>
            <div className="text-lg font-semibold text-purple-600">
              {formatCurrency(summary?.totalDeposits || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="text-xs text-slate-500">Total Bets</div>
            <div className="text-lg font-semibold text-blue-600">
              {summary?.totalBets || 0}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Recent Transactions</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="mb-4">No transactions yet</p>
              <button
                onClick={() => setShowDepositModal(true)}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Add your first deposit →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getTypeColor(tx.type)}`}>
                      {tx.type}
                    </span>
                    <div>
                      <div className="font-medium text-slate-800">
                        {tx.type === 'bet' || tx.type === 'win' || tx.type === 'loss'
                          ? tx.strategyName || tx.signalId
                          : tx.notes || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </div>
                      <div className="text-xs text-slate-500">{formatDate(tx.date)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      tx.type === 'win' || tx.type === 'deposit' || tx.type === 'push'
                        ? 'text-green-600'
                        : tx.type === 'loss' || tx.type === 'bet' || tx.type === 'withdrawal'
                        ? 'text-red-600'
                        : 'text-slate-800'
                    }`}>
                      {tx.type === 'win' || tx.type === 'deposit' || tx.type === 'push' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Balance: {formatCurrency(tx.runningBalance)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Add Funds</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                value={depositNotes}
                onChange={(e) => setDepositNotes(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Initial bankroll"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={actionLoading || !depositAmount}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Adding...' : 'Add Funds'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
