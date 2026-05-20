/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingDown, Calendar, ShieldAlert, Sparkles, AlertCircle, 
  Pocket, PlusCircle, ArrowRight, ShieldCheck, ArrowUpRight, ArrowUpCircle, Settings, Edit
} from 'lucide-react';
import { Expense, SurvivalMetrics } from '../types';

interface DashboardProps {
  initialBalance: number;
  nextAllowanceDate: string;
  expenses: Expense[];
  onNavigateToRecord: () => void;
  onNavigateToHistory: () => void;
  metrics: SurvivalMetrics;
  onAddMoney: (amount: number) => void;
  onUpdateSetup?: (newBalance: number, newDate: string) => void;
}

export default function Dashboard({ 
  initialBalance, 
  nextAllowanceDate, 
  expenses, 
  onNavigateToRecord, 
  onNavigateToHistory,
  metrics,
  onAddMoney,
  onUpdateSetup
}: DashboardProps) {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [topUpError, setTopUpError] = useState('');

  // Editing Budget and Reset Date State
  const [isEditSettingsOpen, setIsEditSettingsOpen] = useState(false);
  const [editedBalance, setEditedBalance] = useState(initialBalance.toString());
  const [editedDate, setEditedDate] = useState(nextAllowanceDate);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState('');

  // Sychronize states if parent updates
  useEffect(() => {
    setEditedBalance(initialBalance.toString());
  }, [initialBalance]);

  useEffect(() => {
    setEditedDate(nextAllowanceDate);
  }, [nextAllowanceDate]);

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTopUpError('');
    const parsed = parseFloat(topUpAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setTopUpError('Please enter a valid positive RM amount.');
      return;
    }
    onAddMoney(parsed);
    setTopUpSuccess(true);
    setTopUpAmount('');
    setTimeout(() => {
      setTopUpSuccess(false);
      setIsTopUpOpen(false);
    }, 1500);
  };

  const handleEditSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    const parsedBalance = parseFloat(editedBalance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      setEditError('Please enter a valid positive allowance amount.');
      return;
    }
    if (!editedDate) {
      setEditError('Please specify the next reset date.');
      return;
    }
    if (onUpdateSetup) {
      onUpdateSetup(parsedBalance, editedDate);
    }
    setEditSuccess(true);
    setTimeout(() => {
      setEditSuccess(false);
      setIsEditSettingsOpen(false);
    }, 1500);
  };

  // Group expenses by category for a mini breakdown in the dashboard
  const categoryTotals: { [key: string]: number } = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const topCategories = Object.entries(categoryTotals)
    .map(([cat, amount]) => ({ cat, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // Natural Tones Status Visual Attributes
  const statusColors = {
    Safe: 'bg-[#f5f5f0] border-[#5A5A40]/30 text-[#5A5A40]',
    Warning: 'bg-[#fdf8f2] border-[#D4A373]/30 text-[#D4A373]',
    Overspending: 'bg-[#fff5r5] bg-[#fff5f5] border-red-200 text-[#a34444]'
  };

  const statusIcons = {
    Safe: <ShieldCheck className="w-6 h-6 text-[#5A5A40]" />,
    Warning: <AlertCircle className="w-6 h-6 text-[#D4A373] animate-pulse" />,
    Overspending: <ShieldAlert className="w-6 h-6 text-[#a34444] animate-bounce" />
  };

  // Percentages for progress visualizers
  const totalSpent = metrics.totalExpensesAmount;
  const remainingPercent = Math.max(0, Math.min(100, (metrics.remainingBalance / initialBalance) * 100));

  return (
    <div id="dashboard-view" className="space-y-6 font-sans">
      
      {/* Survival Status Hero Meter */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 sm:p-8 rounded-[32px] border ${statusColors[metrics.status]} relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm`}
      >
        <div className="space-y-2 z-10 flex-grow">
          <div className="flex items-center gap-2">
            {statusIcons[metrics.status]}
            <span className="text-xs uppercase font-mono tracking-widest font-extrabold text-[#7a7a6a]">
              Pocket Survival Status
            </span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-serif italic font-bold tracking-tight">
            Status: {metrics.status}
          </h2>
          
          <p className="text-[#3d3d33] text-xs sm:text-sm max-w-xl leading-relaxed">
            {metrics.statusMessage}
          </p>
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap gap-2.5 z-10 shrink-0 w-full md:w-auto">
          {/* Edit Settings Button */}
          <button
            id="edit-allowance-settings-btn"
            onClick={() => {
              setIsEditSettingsOpen(!isEditSettingsOpen);
              setIsTopUpOpen(false);
            }}
            className="flex-1 md:flex-none px-4 py-3 bg-white hover:bg-[#f5f5f0] text-[#5A5A40] border border-[#e5e5d1] font-bold text-xs tracking-wider uppercase rounded-2xl transition-all shadow-sm active:translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <Settings size={14} />
            Edit Settings
          </button>

          {/* Add Money Button */}
          <button
            id="quick-add-money-btn"
            onClick={() => {
              setIsTopUpOpen(!isTopUpOpen);
              setIsEditSettingsOpen(false);
            }}
            className="flex-1 md:flex-none px-4 py-3 bg-white hover:bg-[#fcf8f2] text-[#D4A373] border border-[#D4A373]/50 font-bold text-xs tracking-wider uppercase rounded-2xl transition-all shadow-sm active:translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <ArrowUpCircle size={14} />
            Top Up
          </button>

          {/* Log Spent Button */}
          <button
            id="quick-add-expense-btn"
            onClick={onNavigateToRecord}
            className="flex-1 md:flex-none px-5 py-3.5 bg-[#5A5A40] hover:bg-[#4a4a34] text-white font-bold text-xs tracking-wider uppercase rounded-2xl transition-all shadow-md active:translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <PlusCircle size={15} className="text-[#D4A373]" />
            Log Spent
          </button>
        </div>
      </motion.div>

      {/* Dynamic Inline Top-Up Panel */}
      <AnimatePresence>
        {isTopUpOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#fcf8f2] border border-[#D4A373]/40 rounded-[24px] p-5 space-y-3.5 overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4A373] animate-ping"></span>
                  Load Funds / Pocket Top Up
                </h3>
                <p className="text-[11px] text-[#7a7a6a] mt-0.5">
                  Top up your simulated allowance pockets. Recomputes your survival limits in real-time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTopUpOpen(false)}
                className="text-[10px] text-[#7a7a6a] hover:text-[#5A5A40] bg-white border border-[#e5e5d1] rounded-lg px-2.5 py-1"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-bold text-[#5A5A40] font-mono">
                  RM
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50.00"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-[#e5e5d1] rounded-xl focus:border-[#D4A373] focus:outline-none transition-all text-sm font-bold text-[#3d3d33] font-mono"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#D4A373] hover:bg-[#c39262] text-white text-xs font-bold tracking-widest uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                Confirm Load
              </button>
            </form>

            {topUpError && (
              <p className="text-xs text-[#a34444] font-semibold flex items-center gap-1">
                ⚠️ {topUpError}
              </p>
            )}

            {topUpSuccess && (
              <p className="text-xs text-[#5A5A40] font-bold flex items-center gap-1 bg-[#f5f5f0] p-2 rounded-xl">
                🎉 Success! Money added safely to your pocket allowance.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Inline Settings Edit Panel */}
      <AnimatePresence>
        {isEditSettingsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#f5f5f0] border border-[#5A5A40]/30 rounded-[24px] p-5 space-y-3.5 overflow-hidden font-sans"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5A5A40] animate-pulse"></span>
                  Allowance Budget & Reset Calendar Target Settings
                </h3>
                <p className="text-[11px] text-[#7a7a6a] mt-0.5">
                  Adjust initial allowance level or schedule next resetting target without wiping out your detailed expenses history ledger record!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditSettingsOpen(false)}
                className="text-[10px] text-[#7a7a6a] hover:text-[#5A5A40] bg-white border border-[#e5e5d1] rounded-lg px-2.5 py-1"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleEditSetupSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#7a7a6a] uppercase tracking-wider font-mono">
                  Simulated Allowance (RM)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-xs font-bold text-[#5A5A40] font-mono">
                    RM
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editedBalance}
                    onChange={(e) => setEditedBalance(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 bg-white border border-[#e5e5d1] rounded-xl focus:border-[#5A5A40] focus:outline-none transition-all text-xs font-bold text-[#3d3d33] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#7a7a6a] uppercase tracking-wider font-mono">
                  Next Allowance Day RESET Target
                </label>
                <input
                  type="date"
                  required
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-[#e5e5d1] rounded-xl focus:border-[#53533b] focus:outline-none transition-all text-xs font-bold text-[#3d3d33] font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#5A5A40] hover:bg-[#4a4a34] text-white text-xs font-bold tracking-widest uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                Save Settings
              </button>
            </form>

            {editError && (
              <p className="text-xs text-[#a34444] font-semibold flex items-center gap-1">
                ⚠️ {editError}
              </p>
            )}

            {editSuccess && (
              <p className="text-xs text-[#5A5A40] font-bold flex items-center gap-1 bg-white p-2 border border-[#5A5A40]/20 rounded-xl">
                🎉 Settings changed! Allowance parameters and daily safety values recalculated instantly.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main stats bento system - Premium rounded corners with border [#e5e5d1] */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric Card 1: Remaining Wallet Balance */}
        <div className="bg-white p-5 rounded-[24px] border border-[#e5e5d1] flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold text-[#8a8a7a] uppercase tracking-widest leading-none block">
              Remaining Balance
            </span>
            <div className="p-1.5 bg-[#f5f5f0] text-[#5A5A40] rounded-lg">
              <Pocket size={14} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#3d3d33] truncate">
              RM {metrics.remainingBalance.toFixed(2)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-[#8a8a7a]">
              <button 
                onClick={() => {
                  setIsEditSettingsOpen(true);
                  setIsTopUpOpen(false);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="font-medium text-[#5A5A40] hover:underline hover:text-[#D4A373] text-left cursor-pointer"
                title="Edit initial budget allowance"
              >
                Initially RM {initialBalance.toFixed(2)} ✎
              </button>
              <button 
                onClick={() => {
                  setIsTopUpOpen(true);
                  setIsEditSettingsOpen(false);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="text-[#D4A373] hover:underline font-extrabold cursor-pointer hover:text-[#c39262] shrink-0"
              >
                [+ Top Up]
              </button>
            </div>
          </div>
        </div>

        {/* Metric Card 2: Safe Daily spending rate */}
        <div className="bg-white p-5 rounded-[24px] border border-[#e5e5d1] flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold text-[#8a8a7a] uppercase tracking-widest leading-none">
              Safe Daily Limit
            </span>
            <div className="p-1.5 bg-[#f5f5f0] text-[#D4A373] rounded-lg">
              <TrendingDown size={14} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#5A5A40]">
              RM {metrics.safeDailySpendingLimit.toFixed(2)}
            </div>
            <div className="mt-2 text-[10px] text-[#8a8a7a] font-semibold">
              Spend strictly under this per day
            </div>
          </div>
        </div>

        {/* Metric Card 3: Elapsed/Remaining calendar days */}
        <div className="bg-white p-5 rounded-[24px] border border-[#e5e5d1] flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold text-[#8a8a7a] uppercase tracking-widest leading-none">
              Days Left
            </span>
            <div className="p-1.5 bg-[#f5f5f0] text-[#7a7a6a] rounded-lg">
              <Calendar size={14} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#3d3d33]">
              {metrics.daysUntilNextAllowance} Days
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-[#8a8a7a]">
              <span className="font-semibold truncate max-w-[90px]" title={`Reset date: ${nextAllowanceDate}`}>Target: {nextAllowanceDate}</span>
              <button 
                onClick={() => {
                  setIsEditSettingsOpen(true);
                  setIsTopUpOpen(false);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="text-[#D4A373] hover:underline font-extrabold cursor-pointer hover:text-[#c39262] shrink-0"
              >
                [Change]
              </button>
            </div>
          </div>
        </div>

        {/* Metric Card 4: Total expenses logged */}
        <div className="bg-white p-5 rounded-[24px] border border-[#e5e5d1] flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[10px] sm:text-xs font-bold text-[#8a8a7a] uppercase tracking-widest leading-none">
              Total Expenses
            </span>
            <div className="p-1.5 bg-[#f5f5f0] text-[#a34444] rounded-lg">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#3d3d33]">
              RM {metrics.totalExpensesAmount.toFixed(2)}
            </div>
            <div className="mt-2 text-[10px] text-[#8a8a7a] font-semibold">
              Logged {metrics.totalExpensesCount} snapshots
            </div>
          </div>
        </div>

      </div>

      {/* Visual meter bar & summary split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 col: Progress meter explaining safety ratios */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e5d1] space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-base font-serif italic text-[#5A5A40] font-bold">
              Budget Usage Forecast
            </h3>
            <p className="text-[#8a8a7a] text-xs">
              Visual gauge measuring the volume of allowance consumed vs preserved.
            </p>
          </div>

          {/* Progress bar with terracotta / sage accents */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono font-bold text-[#7a7a6a]">
              <span>RM {totalSpent.toFixed(2)} Spent ({Math.max(0, 100 - remainingPercent).toFixed(0)}%)</span>
              <span>RM {metrics.remainingBalance.toFixed(2)} Left ({remainingPercent.toFixed(0)}%)</span>
            </div>
            <div className="w-full h-4 bg-[#f5f5f0] rounded-full overflow-hidden flex border border-[#e5e5d1]/60">
              <div 
                className={`h-full transition-all duration-500 ${
                  metrics.status === 'Safe' ? 'bg-[#5A5A40]' :
                  metrics.status === 'Warning' ? 'bg-[#D4A373]' : 'bg-[#a34444]'
                }`}
                style={{ width: `${Math.max(3, 100 - remainingPercent)}%` }}
              />
              <div className="flex-1 h-full bg-[#f5f5f0]" />
            </div>
          </div>

          {/* Quick recommendations list using natural warm tones design */}
          <div className="space-y-3.5 border-t border-[#f0f0e8] pt-5">
            <h4 className="text-xs font-bold text-[#8a8a7a] uppercase tracking-wider font-mono">
              Weekly Pocket Tips
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5 text-xs text-[#3d3d33] leading-normal bg-[#fdfcf8] p-3.5 rounded-2xl border border-[#e5e5d1]">
                <span className="p-1 px-1.5 bg-[#f5f5f0] border border-[#e5e5d1] text-[#5A5A40] rounded-lg text-[9px] font-bold font-mono shrink-0">TIP 1</span>
                <span>Cook in bulk at hostiles or study quarters. Food accounts for the bulk of student warning triggers.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#3d3d33] leading-normal bg-[#fdfcf8] p-3.5 rounded-2xl border border-[#e5e5d1]">
                <span className="p-1 px-1.5 bg-[#f5f5f0] border border-[#e5e5d1] text-[#5A5A40] rounded-lg text-[9px] font-bold font-mono shrink-0">TIP 2</span>
                <span>Leverage campus Wi-Fi or local student telco packages, minimizing social outings near allowance resets.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 col: Category distribution snapshot */}
        <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e5d1] flex flex-col justify-between gap-6">
          <div className="space-y-1.5">
            <h3 className="text-base font-serif italic text-[#5A5A40] font-bold">
              Vanishing Check
            </h3>
            <p className="text-[#8a8a7a] text-xs">
              Where your Pocket funds are disappearing.
            </p>
          </div>

          <div className="flex-grow flex flex-col justify-center space-y-3">
            {topCategories.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-[#8a8a7a] leading-relaxed">No expenses logged yet. Your allowance is completely pristine!</p>
              </div>
            ) : (
              topCategories.map(({ cat, amount }) => {
                const percent = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-[#3d3d33]">
                      <span>{catLabel}</span>
                      <span className="font-mono text-[#7a7a6a]">RM {amount.toFixed(2)} ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[#f0f0e8] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#5A5A40] rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={onNavigateToHistory}
            className="w-full py-3 px-3.5 bg-[#f5f5f0] hover:bg-[#eaeae0] border border-[#e5e5d1] text-[#5A5A40] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>See Full Ledger</span>
            <ArrowRight size={13} className="text-[#D4A373]" />
          </button>
        </div>

      </div>

    </div>
  );
}
