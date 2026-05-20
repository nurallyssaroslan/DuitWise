/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Wallet, ShieldAlert, Sparkles, TrendingDown, ArrowRight, Zap, GraduationCap, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div id="landing-page" className="min-h-screen bg-[#fdfcf8] text-[#3d3d33] flex flex-col justify-between overflow-hidden relative font-sans">
      {/* Background blobs for premium depth */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#5A5A40]/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4A373]/5 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex justify-between items-center z-10 border-b border-[#e5e5d1]/55">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#5A5A40] rounded-xl text-white shadow-md shadow-[#5A5A40]/10">
            <Wallet size={22} className="animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#5A5A40]">
            DuitWise Snap
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-[#f5f5f0] text-[#5A5A40] px-3.5 py-1.5 rounded-full border border-[#e5e5d1]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5A5A40] animate-pulse"></span>
          Student Edition
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-grow flex flex-col lg:flex-row items-center justify-center gap-12 z-10 w-full">
        {/* Left column: Text & CTA */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f5f5f0] border border-[#e5e5d1] text-[#5A5A40] text-xs font-medium mb-6 hover:bg-[#eaeae0] transition-all cursor-default"
          >
            <GraduationCap size={14} className="text-[#5A5A40]" />
            <span>Smart Student Budget Simulator</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-serif italic text-[#5A5A40] tracking-tight leading-[1.1] mb-6"
          >
            Don't let your allowance <br className="hidden sm:inline" />
            <span className="text-[#D4A373] not-italic font-bold block mt-1">
              snap before you do.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#7a7a6a] text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
          >
            DuitWise Snap calculates your live survival status, daily spending allowance, and highlights spending categories to help you stay afloat until your next fund load.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8"
          >
            <button
              id="get-started-btn"
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 bg-[#5A5A40] hover:bg-[#4a4a34] text-white font-semibold rounded-2xl shadow-lg shadow-[#5A5A40]/10 hover:shadow-[#5A5A40]/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group cursor-pointer"
            >
              Start Survival Tracking
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform text-[#D4A373]" />
            </button>
            <a
              href="#survival-pillars"
              className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-[#fcfcf7] text-[#5A5A40] font-semibold rounded-2xl border border-[#e5e5d1] transition-all text-center"
            >
              How it Works
            </a>
          </motion.div>

          {/* Social Proof points with Natural Tones colors */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-[#e5e5d1] pt-8 max-w-lg mx-auto lg:mx-0"
          >
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <CheckCircle size={16} className="text-[#5A5A40] shrink-0" />
              <span className="text-[#7a7a6a] text-xs font-semibold">Auto Daily Limits</span>
            </div>
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <CheckCircle size={16} className="text-[#D4A373] shrink-0" />
              <span className="text-[#7a7a6a] text-xs font-semibold">Survival Alerts</span>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center gap-2 justify-center lg:justify-start">
              <CheckCircle size={16} className="text-[#7a7a6a] shrink-0" />
              <span className="text-[#7a7a6a] text-xs font-semibold">Zero Setup Cost</span>
            </div>
          </motion.div>
        </div>

        {/* Right column: Visual simulator card preview - Sage/Olive background and terracotta colors */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
          className="flex-1 w-full max-w-md"
        >
          <div className="bg-[#5A5A40] rounded-[32px] p-6 sm:p-8 text-white shadow-2xl relative border border-[#7a7a6a]">
            {/* Glossy indicators with Natural Tones */}
            <div className="absolute top-5 right-5 flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a34444]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4A373]" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
            </div>

            <div className="flex items-center gap-2 mb-6 text-white/70 text-xs font-semibold tracking-wider uppercase">
              <Zap size={14} className="text-[#D4A373] animate-bounce fill-[#D4A373]" />
              Live Simulator Preview
            </div>

            {/* Simulated Balance */}
            <div className="mb-6">
              <span className="text-xs text-white/60 font-medium">Remaining Survival Balance</span>
              <div className="text-3xl sm:text-4xl font-black font-mono mt-1 text-white">
                RM 240.50
              </div>
              <div className="mt-2.5 text-xs bg-white/10 border border-white/20 text-white/95 py-1.5 px-3 rounded-xl inline-flex items-center gap-1.5">
                <ShieldAlert size={12} className="shrink-0 text-[#D4A373]" />
                <span>Status: <strong className="font-bold">Safe</strong> (Daily limit: RM 24.05)</span>
              </div>
            </div>

            {/* Simulated stats list */}
            <div className="space-y-4 border-t border-white/10 pt-6">
              <div className="flex justify-between items-center bg-white/5 p-3.5 rounded-2xl">
                <div>
                  <div className="text-[10px] text-white/50 font-semibold font-mono uppercase">Survival Status</div>
                  <div className="text-sm font-bold text-white">Safe Allowance Zone</div>
                </div>
                <span className="px-3 py-1 text-xs font-bold text-[#D4A373] bg-white/10 rounded-full">
                  100% OK
                </span>
              </div>

              <div className="flex justify-between items-center bg-white/5 p-3.5 rounded-2xl">
                <div>
                  <div className="text-[10px] text-white/50 font-semibold font-mono uppercase">Days Until Refund</div>
                  <div className="text-sm font-bold text-white">10 Days Left</div>
                </div>
                <span className="text-white/80 text-xs font-mono font-medium">Until May 30</span>
              </div>

              <div className="flex justify-between items-center bg-white/5 p-3.5 rounded-2xl">
                <div>
                  <div className="text-[10px] text-white/50 font-semibold font-mono uppercase">Total Expenses</div>
                  <div className="text-sm font-bold text-white">RM 159.50 Recorded</div>
                </div>
                <span className="text-[#D4A373] text-xs font-mono font-semibold">6 logs</span>
              </div>
            </div>

            {/* Bottom mini-branding */}
            <div className="text-[10px] text-center text-white/40 font-mono tracking-wider mt-6">
              DuitWise Engine v1.0.0
            </div>
          </div>
        </motion.div>
      </main>

      {/* Value pillars section */}
      <section id="survival-pillars" className="bg-white border-t border-[#e5e5d1] py-16 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-serif text-[#5A5A40] italic">
              Designed For The Campus Survival Mode
            </h2>
            <p className="text-[#7a7a6a] mt-3 text-sm sm:text-base">
              No complex financial diagrams. Just the cold, hard numbers that help you survive till the next allowance loading.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#fdfcf8] rounded-[24px] p-6 border border-[#e5e5d1]">
              <div className="w-10 h-10 rounded-xl bg-[#f5f5f0] text-[#5A5A40] flex items-center justify-center mb-4">
                <TrendingDown size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#5A5A40]">Safe Daily Limit Calculator</h3>
              <p className="text-[#7a7a6a] text-sm mt-2 leading-relaxed">
                App dynamically divides remaining balance by remaining days. Helps you decide if you can afford to dine out or must retreat to cup noodles.
              </p>
            </div>

            <div className="bg-[#fdfcf8] rounded-[24px] p-6 border border-[#e5e5d1]">
              <div className="w-10 h-10 rounded-xl bg-[#f5f5f0] text-[#D4A373] flex items-center justify-center mb-4">
                <ShieldAlert size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#5A5A40]">Live Warning System</h3>
              <p className="text-[#7a7a6a] text-sm mt-2 leading-relaxed">
                Instant classification into Safe, Warning, or Overspending based on how actual daily spending squares against the safe limit.
              </p>
            </div>

            <div className="bg-[#fdfcf8] rounded-[24px] p-6 border border-[#e5e5d1]">
              <div className="w-10 h-10 rounded-xl bg-[#f5f5f0] text-[#7a7a6a] flex items-center justify-center mb-4">
                <Sparkles size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#5A5A40]">Simple Cash Ledger</h3>
              <p className="text-[#7a7a6a] text-sm mt-2 leading-relaxed">
                Log quick snapshots of meals, transport, studies, and outings. Clear visual analytics help you pinpoint where the money vanished.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#5A5A40] border-t border-[#7a7a6a] text-white/70 text-xs py-8 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 DuitWise Snap. Built with safety triggers for student finances.</p>
          <p className="font-mono text-[10px] text-white/50">Persisted locally in your browser sandbox</p>
        </div>
      </footer>
    </div>
  );
}
