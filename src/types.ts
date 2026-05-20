/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO format: YYYY-MM-DD
}

export interface AllowanceSetup {
  initialBalance: number;
  nextAllowanceDate: string; // ISO format: YYYY-MM-DD
}

export interface UserSession {
  email: string | null;
  isLoggedIn: boolean;
  hasCompletedSetup: boolean;
}

export type SurvivalStatus = 'Safe' | 'Warning' | 'Overspending';

export interface SurvivalMetrics {
  remainingBalance: number;
  daysUntilNextAllowance: number;
  safeDailySpendingLimit: number;
  totalExpensesCount: number;
  totalExpensesAmount: number;
  status: SurvivalStatus;
  statusColor: string;
  statusMessage: string;
}

export const CATEGORIES = [
  { value: 'food', label: 'Food & Drinks', icon: 'Utensils', color: '#5A5A40', bg: 'bg-[#f5f5f0] text-[#5A5A40] border-[#e5e5d1]' },
  { value: 'transport', label: 'Transport', icon: 'Car', color: '#D4A373', bg: 'bg-[#fdfcf7] text-[#D4A373] border-[#e5e5d1]' },
  { value: 'study', label: 'Studying & Books', icon: 'BookOpen', color: '#7a7a6a', bg: 'bg-[#f5f5f0] text-[#7a7a6a] border-[#e5e5d1]' },
  { value: 'social', label: 'Social & Entertainment', icon: 'Sparkles', color: '#b5a075', bg: 'bg-[#fdfcf7] text-[#b5a075] border-[#e5e5d1]' },
  { value: 'rent', label: 'Acc & Rent', icon: 'Home', color: '#9c6d42', bg: 'bg-[#fcf8f2] text-[#9c6d42] border-[#e5e5d1]' },
  { value: 'others', label: 'Others', icon: 'CircleEllipsis', color: '#8a8a7a', bg: 'bg-[#f5f5f0] text-[#8a8a7a] border-[#e5e5d1]' }
];
