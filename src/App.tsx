/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, LogOut, LayoutDashboard, PlusCircle, ListTodo, RefreshCw, 
  HelpCircle, Sparkles, User, Github, AlertCircle, Calendar, ShieldCheck
} from 'lucide-react';

import LandingPage from './components/LandingPage';
import LoginSignUp from './components/LoginSignUp';
import SetupPage from './components/SetupPage';
import Dashboard from './components/Dashboard';
import RecordExpense from './components/RecordExpense';
import ExpenseList from './components/ExpenseList';

import { Expense, AllowanceSetup, UserSession, SurvivalMetrics, SurvivalStatus } from './types';

export default function App() {
  // Primary session states loaded from local storage
  const [session, setSession] = useState<UserSession>({
    email: null,
    isLoggedIn: false,
    hasCompletedSetup: false,
  });

  const [setup, setSetup] = useState<AllowanceSetup>({
    initialBalance: 0,
    nextAllowanceDate: '',
  });

  const [setupDate, setSetupDate] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [viewingAuth, setViewingAuth] = useState(false);
  const [activeSubPage, setActiveSubPage] = useState<'dashboard' | 'record' | 'ledger'>('dashboard');
  const [showFaq, setShowFaq] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('duitwise_session');
    const savedSetup = localStorage.getItem('duitwise_setup');
    const savedSetupDate = localStorage.getItem('duitwise_setup_date');
    const savedExpenses = localStorage.getItem('duitwise_expenses');

    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
    if (savedSetup) {
      setSetup(JSON.parse(savedSetup));
    }
    if (savedSetupDate) {
      setSetupDate(savedSetupDate);
    }
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  // Save to local storage when state changes
  const saveSessionToStorage = (newSession: UserSession) => {
    setSession(newSession);
    localStorage.setItem('duitwise_session', JSON.stringify(newSession));
  };

  const handleLoginSuccess = (email: string) => {
    const newSession = {
      email,
      isLoggedIn: true,
      hasCompletedSetup: localStorage.getItem('duitwise_setup') !== null,
    };
    saveSessionToStorage(newSession);
    setViewingAuth(false);
  };

  const handleLogout = () => {
    const newSession = {
      email: null,
      isLoggedIn: false,
      hasCompletedSetup: false,
    };
    saveSessionToStorage(newSession);
    setActiveSubPage('dashboard');
  };

  // Completely resets simulation parameters to try a different balance or date
  const handleResetSimulation = () => {
    if (window.confirm('Are you sure you want to completely erase the current pocket allowance setup and logged expenses?')) {
      localStorage.removeItem('duitwise_setup');
      localStorage.removeItem('duitwise_setup_date');
      localStorage.removeItem('duitwise_expenses');
      
      setSetup({ initialBalance: 0, nextAllowanceDate: '' });
      setSetupDate('');
      setExpenses([]);
      
      const updatedSession = { ...session, hasCompletedSetup: false };
      saveSessionToStorage(updatedSession);
      setActiveSubPage('dashboard');
    }
  };

  const handleSetupSave = (balance: number, nextAllowanceDate: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const newSetup = {
      initialBalance: balance,
      nextAllowanceDate,
    };

    setSetup(newSetup);
    setSetupDate(todayStr);
    
    // Create pre-populated initial demonstration expenses to showcase budget status right away!
    const demonstrationExpenses: Expense[] = [
      {
        id: '1',
        amount: 8.50,
        category: 'food',
        description: 'Hostel Canteen lunch',
        date: todayStr
      },
      {
        id: '2',
        amount: 32.00,
        category: 'study',
        description: 'Programming reference booklet printout',
        date: todayStr
      },
      {
        id: '3',
        amount: 4.00,
        category: 'transport',
        description: 'LRT single fare ticket',
        date: todayStr
      }
    ];

    setExpenses(demonstrationExpenses);

    localStorage.setItem('duitwise_setup', JSON.stringify(newSetup));
    localStorage.setItem('duitwise_setup_date', todayStr);
    localStorage.setItem('duitwise_expenses', JSON.stringify(demonstrationExpenses));

    const updatedSession = {
      ...session,
      hasCompletedSetup: true,
    };
    saveSessionToStorage(updatedSession);
    setActiveSubPage('dashboard');
  };

  // Expense handlers
  const handleAddExpense = (newExp: Omit<Expense, 'id'>) => {
    const withId: Expense = {
      ...newExp,
      id: Math.random().toString(36).substring(2, 9),
    };
    const updated = [withId, ...expenses];
    setExpenses(updated);
    localStorage.setItem('duitwise_expenses', JSON.stringify(updated));
    setActiveSubPage('dashboard');
  };

  const handleAddMoney = (amount: number) => {
    const updatedSetup = {
      ...setup,
      initialBalance: setup.initialBalance + amount,
    };
    setSetup(updatedSetup);
    localStorage.setItem('duitwise_setup', JSON.stringify(updatedSetup));
  };

  const handleUpdateSetup = (newBalance: number, newDate: string) => {
    const updatedSetup = {
      initialBalance: newBalance,
      nextAllowanceDate: newDate,
    };
    setSetup(updatedSetup);
    localStorage.setItem('duitwise_setup', JSON.stringify(updatedSetup));
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(exp => exp.id !== id);
    setExpenses(updated);
    localStorage.setItem('duitwise_expenses', JSON.stringify(updated));
  };

  // CORE METRIC CALCULATOR ENGINE
  const computeSurvivalMetrics = (): SurvivalMetrics => {
    const totalExpensesAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalExpensesCount = expenses.length;
    const remainingBalance = Math.max(0, setup.initialBalance - totalExpensesAmount);

    // Compute remaining days until allowance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allowanceDate = new Date(setup.nextAllowanceDate || new Date());
    allowanceDate.setHours(0, 0, 0, 0);

    const timeDiff = allowanceDate.getTime() - today.getTime();
    const daysUntilNextAllowance = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

    // Safe daily limit
    const safeDailySpendingLimit = daysUntilNextAllowance > 0 ? (remainingBalance / daysUntilNextAllowance) : 0;

    // SURVIVAL RATIO ASSESSMENT
    // Total days in the allowance block
    const sDate = new Date(setupDate || new Date());
    sDate.setHours(0, 0, 0, 0);
    const totalDiff = allowanceDate.getTime() - sDate.getTime();
    const totalCycleDays = Math.max(5, Math.ceil(totalDiff / (1000 * 60 * 60 * 24)));

    const daysRatio = daysUntilNextAllowance / totalCycleDays;
    const balanceRatio = setup.initialBalance > 0 ? (remainingBalance / setup.initialBalance) : 0;

    let status: SurvivalStatus = 'Safe';
    let statusColor = 'text-[#5A5A40] bg-[#f5f5f0] border-[#5A5A40]/30';
    let statusMessage = 'Excellent progress! Your spending rate matches perfectly under your calendar days allowance quota.';

    if (remainingBalance <= 0) {
      status = 'Overspending';
      statusColor = 'text-[#a34444] bg-red-50 border-red-200';
      statusMessage = '🚨 Budget deficit! You are completely out of simulation pocket funds. Trigger cup noodle survival mode.';
    } else if (balanceRatio < daysRatio * 0.40) {
      status = 'Overspending';
      statusColor = 'text-[#a34444] bg-red-50 border-red-200';
      statusMessage = '🚨 Severe overspending! Pocket funds are depleting several times faster than time. Instantly restrict unnecessary cafeteria bills!';
    } else if (balanceRatio < daysRatio * 0.70) {
      status = 'Warning';
      statusColor = 'text-[#D4A373] bg-[#fdf8f2] border-[#D4A373]/30';
      statusMessage = '⚠️ Notice: Your cash reserves have drained relatively faster than calendar days. Look for free student events and scale back snacks.';
    }

    return {
      remainingBalance,
      daysUntilNextAllowance,
      safeDailySpendingLimit,
      totalExpensesCount,
      totalExpensesAmount,
      status,
      statusColor,
      statusMessage
    };
  };

  const metrics = computeSurvivalMetrics();

  // Rendering routing states
  if (!session.isLoggedIn) {
    if (viewingAuth) {
      return (
        <LoginSignUp 
          onSuccess={handleLoginSuccess} 
          onBack={() => setViewingAuth(false)} 
        />
      );
    }
    return <LandingPage onStart={() => setViewingAuth(true)} />;
  }

  if (!session.hasCompletedSetup) {
    return (
      <SetupPage 
        initialData={setup.initialBalance > 0 ? setup : undefined}
        onSave={handleSetupSave} 
        username={session.email || 'Student'} 
      />
    );
  }

  return (
    <div id="app-shell" className="min-h-screen bg-[#fdfcf8] text-[#3d3d33] flex flex-col justify-between select-none font-sans">
      
      {/* Top Main Navigation Bar with Natural Tones colors */}
      <header className="bg-white border-b border-[#e5e5d1] sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Brand header */}
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#5A5A40] rounded-xl text-white shadow-sm">
              <Wallet size={18} />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#5A5A40] block leading-none">
                DuitWise Snap
              </span>
              <span className="text-[10px] text-[#8a8a7a] font-mono tracking-wider block mt-1">
                CAMPUS PORTFOLIO
              </span>
            </div>
          </div>

          {/* User actions / quick labels */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            {/* User tag */}
            <div className="flex items-center gap-1.5 text-[#5A5A40] bg-[#f5f5f0] px-3.5 py-1.5 rounded-xl border border-[#e5e5d1]">
              <User size={14} className="text-[#8a8a7a]" />
              <span className="truncate max-w-[120px] font-bold">{session.email?.split('@')[0]}</span>
            </div>

            {/* Quick reset option */}
            <button
              id="reset-simulation-btn"
              onClick={handleResetSimulation}
              className="p-2.5 hover:bg-[#f5f5f0] rounded-xl transition-all text-[#7a7a6a] hover:text-[#5A5A40] flex items-center gap-1 cursor-pointer border border-transparent hover:border-[#e5e5d1]"
              title="Reset pocket limit setup"
            >
              <RefreshCw size={14} />
              <span className="hidden md:inline text-[11px] font-bold">Re-Setup</span>
            </button>

            {/* Logout Trigger */}
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="p-2 px-3.5 bg-white hover:bg-[#fff5f5] hover:text-[#a34444] border border-[#e5e5d1] rounded-xl transition-all text-[#7a7a6a] flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <LogOut size={14} />
              <span>Exit Hub</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Core View Area with subpages switcher */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-8 w-full">
        
        {/* Navigation Tab strip */}
        <div className="flex items-center justify-start border-b border-[#e5e5d1] pb-4 mb-6 gap-2 overflow-x-auto no-scrollbar">
          <button
            id="tab-dashboard"
            onClick={() => setActiveSubPage('dashboard')}
            className={`px-5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
              activeSubPage === 'dashboard' 
                ? 'bg-[#5A5A40] text-white shadow-md' 
                : 'bg-white hover:bg-[#f5f5f0] text-[#7a7a6a] hover:text-[#5A5A40] border border-[#e5e5d1]'
            }`}
          >
            <LayoutDashboard size={14} className={activeSubPage === 'dashboard' ? 'text-[#D4A373]' : ''} />
            <span>Survival Hub</span>
          </button>

          <button
            id="tab-record"
            onClick={() => setActiveSubPage('record')}
            className={`px-5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
              activeSubPage === 'record' 
                ? 'bg-[#5A5A40] text-white shadow-md' 
                : 'bg-white hover:bg-[#f5f5f0] text-[#7a7a6a] hover:text-[#5A5A40] border border-[#e5e5d1]'
            }`}
          >
            <PlusCircle size={14} className={activeSubPage === 'record' ? 'text-[#D4A373]' : ''} />
            <span>Log Spent</span>
          </button>

          <button
            id="tab-ledger"
            onClick={() => setActiveSubPage('ledger')}
            className={`px-5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
              activeSubPage === 'ledger' 
                ? 'bg-[#5A5A40] text-white shadow-md' 
                : 'bg-white hover:bg-[#f5f5f0] text-[#7a7a6a] hover:text-[#5A5A40] border border-[#e5e5d1]'
            }`}
          >
            <ListTodo size={14} className={activeSubPage === 'ledger' ? 'text-[#D4A373]' : ''} />
            <span>Expense Ledger</span>
          </button>
        </div>

        {/* Dynamic page placement */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeSubPage === 'dashboard' && (
              <Dashboard 
                initialBalance={setup.initialBalance}
                nextAllowanceDate={setup.nextAllowanceDate}
                expenses={expenses}
                onNavigateToRecord={() => setActiveSubPage('record')}
                onNavigateToHistory={() => setActiveSubPage('ledger')}
                metrics={metrics}
                onAddMoney={handleAddMoney}
                onUpdateSetup={handleUpdateSetup}
              />
            )}

            {activeSubPage === 'record' && (
              <RecordExpense 
                onAddExpense={handleAddExpense}
                onCancel={() => setActiveSubPage('dashboard')}
                metrics={metrics}
              />
            )}

            {activeSubPage === 'ledger' && (
              <ExpenseList 
                expenses={expenses}
                onDeleteExpense={handleDeleteExpense}
                remainingBalance={metrics.remainingBalance}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dynamic Pocket FAQ accordion drawer styled for Natural Tones */}
        <div className="mt-12 bg-white border border-[#e5e5d1] rounded-[32px] p-6 sm:p-8 space-y-4">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowFaq(!showFaq)}>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#5A5A40]" />
              <label className="text-xs font-extrabold uppercase tracking-widest text-[#5A5A40] select-none">
                Pocket Survival Guide & FAQ
              </label>
            </div>
            <button className="text-[11px] font-bold text-[#D4A373] hover:underline cursor-pointer">
              {showFaq ? 'Collapse Guide' : 'Read Guide'}
            </button>
          </div>

          {showFaq && (
            <div className="text-xs text-[#7a7a6a] space-y-4 pt-4 border-t border-[#f0f0e8]">
              <div className="space-y-1">
                <h4 className="font-bold text-[#3d3d33]">How is my Safe Daily Limit computed?</h4>
                <p className="leading-relaxed">
                  The engine divides your remaining allowance (RM {metrics.remainingBalance.toFixed(2)}) by the days remaining (<strong>{metrics.daysUntilNextAllowance} days</strong>) until your scheduled reset (<strong>{setup.nextAllowanceDate}</strong>).
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#3d3d33]">What does the Safe status mean?</h4>
                <p className="leading-relaxed">
                  Your current balance is well aligned with the cycle timeline. You can spend up to <strong>RM {metrics.safeDailySpendingLimit.toFixed(2)}</strong> every day safely without running completely broke before the top-up arrival.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#3d3d33]">Is Supabase/Database saving securely?</h4>
                <p className="leading-relaxed">
                  Currently, DuitWise Snap saves your records instantly within your local browser cache. Rest assured that no cloud transmission is active, making testing completely private. A real Supabase layer can be hooked up seamlessly in matching parameters later!
                </p>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Footer copyright with Natural Tones details */}
      <footer className="bg-white border-t border-[#e5e5d1] py-6 px-6 text-center text-xs text-[#8a8a7a]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 DuitWise Snap Tracker. All financial parameters are sandboxed in regional memory state.</p>
          <p className="font-mono text-[10px] text-[#8a8a7a] mt-1 sm:mt-0">
            Natural Tones Typographic Theme (Plus Jakarta Sans & Playfair Display Stack)
          </p>
        </div>
      </footer>

    </div>
  );
}
