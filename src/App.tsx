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
import { supabase } from './lib/supabase';

export default function App() {
  // Primary session states
  const [session, setSession] = useState<UserSession>({
    email: null,
    isLoggedIn: false,
    hasCompletedSetup: false,
  });

  const [setup, setSetup] = useState<AllowanceSetup>({
    initialBalance: 0,
    nextAllowanceDate: '',
  });
}