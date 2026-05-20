/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Landmark, Calendar, Sparkles, BookOpen, AlertCircle, TrendingUp } from 'lucide-react';

interface SetupPageProps {
  initialData?: {
    initialBalance: number;
    nextAllowanceDate: string;
  };
  onSave: (balance: number, nextAllowanceDate: string) => void;
  username?: string;
}

export default function SetupPage({ initialData, onSave, username = 'Student' }: SetupPageProps) {
  const [balance, setBalance] = useState<string>('350.00');
  const [nextAllowanceDate, setNextAllowanceDate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [recommendedExpensesMsg, setRecommendedExpensesMsg] = useState<string>('');

  // Set default allowance date to 10 days from today
  useEffect(() => {
    if (initialData) {
      setBalance(initialData.initialBalance.toFixed(2));
      setNextAllowanceDate(initialData.nextAllowanceDate);
    } else {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const year = futureDate.getFullYear();
      const month = String(futureDate.getMonth() + 1).padStart(2, '0');
      const day = String(futureDate.getDate()).padStart(2, '0');
      setNextAllowanceDate(`${year}-${month}-${day}`);
    }
  }, [initialData]);

  // Dynamically calculate simple preview statistics on the setup page
  useEffect(() => {
    const numBal = parseFloat(balance);
    if (!isNaN(numBal) && numBal > 0 && nextAllowanceDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const allowanceDate = new Date(nextAllowanceDate);
      allowanceDate.setHours(0, 0, 0, 0);
      
      const timeDiff = allowanceDate.getTime() - today.getTime();
      const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      if (days > 0) {
        const dailySafe = numBal / days;
        setRecommendedExpensesMsg(
          `Survival simulation forecast: RM ${dailySafe.toFixed(2)} safe daily limit for the next ${days} days.`
        );
      } else {
        setRecommendedExpensesMsg('');
      }
    } else {
      setRecommendedExpensesMsg('');
    }
  }, [balance, nextAllowanceDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      setError('Please specify a positive allowance balance.');
      return;
    }

    if (!nextAllowanceDate) {
      setError('Please select when you will receive your next allowance deposit.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(nextAllowanceDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() <= today.getTime()) {
      setError('The next allowance date must be set in the future (at least tomorrow).');
      return;
    }

    onSave(parsedBalance, nextAllowanceDate);
  };

  return (
    <div id="setup-page" className="min-h-screen bg-[#fdfcf8] text-[#3d3d33] flex items-center justify-center p-6 relative font-sans">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#5A5A40]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#D4A373]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-10 shadow-xl border border-[#e5e5d1] z-10">
        
        {/* Step headers */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs bg-[#f5f5f0] text-[#5A5A40] px-3 py-1 font-bold rounded-full border border-[#e5e5d1] uppercase tracking-widest">
            Wallet Setup
          </span>
          <span className="text-xs text-[#8a8a7a] font-medium">
            Profile: <strong className="text-[#3d3d33] font-semibold">{username.split('@')[0]}</strong>
          </span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <span className="text-2xl sm:text-3xl font-serif italic text-[#5A5A40] tracking-tight block">
            Wallet Parameters
          </span>
          <p className="text-[#7a7a6a] text-sm mt-1 leading-relaxed">
            Configure your active student allowance parameters to calculate dynamic triggers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-[#a34444] rounded-2xl text-xs flex items-center gap-2" id="setup-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Current Balance */}
          <div className="bg-[#f5f5f0] p-5 rounded-2xl border border-[#e5e5d1]">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-widest flex items-center gap-1.5">
                <Landmark size={15} className="text-[#D4A373]" />
                Current Student Balance (RM)
              </label>
              <span className="text-[11px] text-[#8a8a7a] font-mono">Cash/Bank/E-wallet</span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#7a7a6a] font-semibold font-mono">
                RM
              </div>
              <input
                id="setup-balance"
                type="number"
                step="0.01"
                required
                placeholder="250.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#e5e5d1] rounded-xl focus:border-[#5A5A40] focus:outline-none transition-all text-base font-bold text-[#3d3d33] font-mono"
              />
            </div>
            
            <p className="text-[11px] text-[#8a8a7a] mt-2 leading-relaxed">
              Sum of all pocket money, physical currency, bank accounts, and active e-wallets currently at your disposal.
            </p>
          </div>

          {/* Next Allowance Date */}
          <div className="bg-[#f5f5f0] p-5 rounded-2xl border border-[#e5e5d1]">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={15} className="text-[#D4A373]" />
                Next Allowance Date
              </label>
              <span className="text-[11px] text-[#8a8a7a] font-mono">Top-up/Deposited Date</span>
            </div>

            <input
              id="setup-date"
              type="date"
              required
              value={nextAllowanceDate}
              onChange={(e) => setNextAllowanceDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[#e5e5d1] rounded-xl focus:border-[#5A5A40] focus:outline-none transition-all text-sm font-semibold text-[#3d3d33] font-mono"
            />

            <p className="text-[11px] text-[#8a8a7a] mt-2 leading-relaxed">
              When your parent, guardian, or sponsor scholarship scheme triggers your next allowance distribution cycle.
            </p>
          </div>

          {/* Helper preview message based on form values */}
          {recommendedExpensesMsg && (
            <div className="p-4 bg-[#fdfcf7] border border-[#e5e5d1] rounded-2xl text-[#3d3d33] text-xs flex items-center gap-2.5">
              <Sparkles size={16} className="text-[#D4A373] shrink-0" />
              <p className="leading-normal">{recommendedExpensesMsg}</p>
            </div>
          )}

          {/* Guidelines on survival thresholds */}
          <div className="p-4 bg-[#f5f5f0]/80 border border-[#e5e5d1]/60 rounded-2xl">
            <h4 className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 mb-1.5 font-serif">
              <BookOpen size={14} className="text-[#D4A373]" />
              Survival Metrics Thresholds:
            </h4>
            <ul className="list-disc pl-4 text-[11px] text-[#7a7a6a] space-y-1">
              <li><strong>Safe</strong>: Actual average daily spend fits below safe limit.</li>
              <li><strong>Warning</strong>: Spent exceeds safe daily limit for the day but has buffers.</li>
              <li><strong>Overspending</strong>: Spending outpaces allowance or remaining balance is near empty.</li>
            </ul>
          </div>

          <button
            type="submit"
            id="setup-submit-btn"
            className="w-full py-4 px-4 bg-[#5A5A40] hover:bg-[#4a4a34] hover:shadow-lg hover:shadow-[#5A5A40]/10 text-white text-xs font-bold tracking-widest uppercase rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>Activate Budget Simulation</span>
            <TrendingUp size={16} className="text-[#D4A373]" />
          </button>
        </form>
      </div>
    </div>
  );
}
