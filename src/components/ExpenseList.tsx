/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Trash2, AlertCircle, X 
} from 'lucide-react';
import { Expense, CATEGORIES } from '../types';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  remainingBalance: number;
}

export default function ExpenseList({ expenses, onDeleteExpense, remainingBalance }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Compute category grouped totals for summary
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const categorySummary = CATEGORIES.map(cat => {
    const total = expenses
      .filter(exp => exp.category === cat.value)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return {
      ...cat,
      total,
      percent: totalSpent > 0 ? (total / totalSpent) * 100 : 0
    };
  }).filter(c => c.total > 0);

  // Filter & sort list logic
  const filteredExpenses = expenses
    .filter(exp => {
      const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

  const getCategoryDetails = (catValue: string) => {
    const found = CATEGORIES.find(c => c.value === catValue);
    return found || { label: 'Others', bg: 'bg-[#f5f5f0] text-[#8a8a7a] border-[#e5e5d1]', color: '#8a8a7a' };
  };

  return (
    <div id="expense-list-view" className="space-y-6 font-sans">
      
      {/* Category breakdown summary header */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-[#e5e5d1] space-y-4">
        <h3 className="text-base font-serif italic text-[#5A5A40] font-bold">
          Expenditure Breakdown By Category
        </h3>
        
        {categorySummary.length === 0 ? (
          <p className="text-xs text-[#8a8a7a] py-3 text-center">
            No categories populated yet. Start logging expenses to activate visual summary distributions.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {categorySummary.map((cat) => (
              <div 
                key={cat.value} 
                className="p-4 bg-[#fdfcf8] rounded-2xl border border-[#e5e5d1] flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <div>
                    <h4 className="text-xs font-bold text-[#3d3d33]">{cat.label}</h4>
                    <span className="text-[10px] text-[#8a8a7a] font-mono">
                      {cat.percent.toFixed(0)}% of total budget
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#3d3d33] font-mono">
                  RM {cat.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary search ledger and interactive list controls */}
      <div className="bg-white rounded-[32px] border border-[#e5e5d1] p-6 sm:p-8 space-y-5">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-serif italic text-[#5A5A40] font-bold">
              Campus Expense Ledger
            </h3>
            <p className="text-[#8a8a7a] text-xs">
              Search, filter, or scrap logged transaction items.
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Sort Toggle dropdown */}
            <div className="relative w-full sm:w-auto">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs font-semibold px-3 py-2 bg-[#f5f5f0] border border-[#e5e5d1] rounded-xl focus:border-[#5A5A40] focus:outline-none text-[#5A5A40] cursor-pointer font-sans"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Input and Category Filter row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Keyword Search */}
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8a8a7a]">
              <Search size={15} />
            </div>
            <input
              id="search-input"
              type="text"
              placeholder="Search by keywords e.g. sandwich..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-[#f5f5f0] border border-[#e5e5d1] rounded-xl focus:border-[#5A5A40] focus:bg-white focus:outline-none transition-all text-xs text-[#3d3d33] font-sans"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8a8a7a] hover:text-[#5A5A40] cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category quick filters */}
          <div className="relative">
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs font-semibold px-4 py-2.5 bg-[#f5f5f0] border border-[#e5e5d1] rounded-xl focus:border-[#5A5A40] focus:outline-none text-[#5A5A40] cursor-pointer"
            >
              <option value="all">Filer Category: All</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Real-time Ledger Lists */}
        <div className="space-y-3 pt-2">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 bg-[#fdfcf8] rounded-2xl border border-[#e5e5d1]">
              <AlertCircle className="w-8 h-8 text-[#8a8a7a] mx-auto mb-2" />
              <p className="text-xs text-[#5A5A40] font-semibold">No transactions matched your filtering criteria.</p>
              <p className="text-[11px] text-[#8a8a7a] mt-1">Try relaxing filters or search terms.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {filteredExpenses.map((exp) => {
                  const catDetails = getCategoryDetails(exp.category);
                  return (
                    <motion.div
                      key={exp.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -30 }}
                      className="p-4 bg-[#fdfcf8] hover:bg-[#f5f5f0] border border-[#e5e5d1] rounded-2xl transition-all flex justify-between items-center group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1.5 text-[10px] font-bold tracking-tight rounded-xl shrink-0 border ${catDetails.bg}`}>
                          {catDetails.label}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-[#3d3d33] leading-tight">
                            {exp.description}
                          </h4>
                          <span className="text-[10px] text-[#8a8a7a] font-mono">
                            {exp.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm font-bold text-[#3d3d33] font-mono">
                          -RM {exp.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-2 ml-[4px] text-[#8a8a7a] hover:text-[#a34444] hover:bg-red-50 rounded-xl transition-all cursor-pointer opacity-80 hover:opacity-100"
                          title="Delete expense snapshot"
                          id={`delete-btn-${exp.id}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
