/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff, AlertCircle, ArrowLeft, ArrowRight, Zap } from 'lucide-react';

interface LoginSignUpProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export default function LoginSignUp({ onSuccess, onBack }: LoginSignUpProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please fill in all standard credentials.');
      return;
    }

    if (email.indexOf('@') === -1) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 5) {
      setError('Password must contain at least 5 characters for demo safety.');
      return;
    }

    if (isLogin) {
      // For demo login: let anyone in.
      onSuccess(email);
    } else {
      // Simulated sign up
      setSuccessMsg('Account simulated successfully! Logging you in now...');
      setTimeout(() => {
        onSuccess(email);
      }, 1000);
    }
  };

  const handleQuickDemo = () => {
    const demoEmail = 'student.survival@duitwise.edu';
    onSuccess(demoEmail);
  };

  return (
    <div id="login-signup-page" className="min-h-screen bg-[#fdfcf8] text-[#3d3d33] flex items-center justify-center p-6 relative font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#5A5A40]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4A373]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-[32px] p-6 sm:p-10 shadow-xl border border-[#e5e5d1] z-10 flex flex-col justify-between">
        
        {/* Navigation back and Brand */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 ml-[-8px] text-[#7a7a6a] hover:text-[#5A5A40] hover:bg-[#f5f5f0] rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          
          <span className="text-xs font-bold text-[#8a8a7a] font-mono tracking-wider bg-[#f5f5f0] border border-[#e5e5d1] px-2 py-0.5 rounded-md">
            DEMO MODE
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <span className="text-3xl font-serif italic text-[#5A5A40] tracking-tight block">
            {isLogin ? 'Welcome Back' : 'Join DuitWise'}
          </span>
          <p className="text-[#8a8a7a] text-xs mt-2 max-w-xs mx-auto leading-relaxed">
            {isLogin 
              ? 'Get back to controlling your daily student pocket allowance survival status.' 
              : 'Sign up to register a test simulation profile.'}
          </p>
        </div>

        {/* Quick Demo Assist */}
        <div className="mb-6">
          <button
            type="button"
            id="quick-demo-btn"
            onClick={handleQuickDemo}
            className="w-full flex items-center justify-center gap-2.5 p-3.5 bg-[#f5f5f0] border border-[#e5e5d1] hover:border-[#D4A373] rounded-2xl text-[#5A5A40] text-xs font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm cursor-pointer"
          >
            <Zap size={14} className="text-[#D4A373] animate-pulse fill-[#D4A373]" />
            <span>Instant Access: Quick Demo Mode</span>
            <ArrowRight size={14} className="text-[#8a8a7a]" />
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-[#f0f0e8]"></div>
          <span className="flex-shrink mx-4 text-[#8a8a7a] text-[10px] font-mono font-medium tracking-wider uppercase">
            {isLogin ? 'or raw credential login' : 'or manual registration'}
          </span>
          <div className="flex-grow border-t border-[#f0f0e8]"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#a34444] rounded-xl text-xs flex items-center gap-2" id="auth-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#f5f5f0] border border-[#e5e5d1] text-[#5A5A40] rounded-xl text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5A5A40] animate-ping"></span>
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#7a7a6a] uppercase tracking-widest mb-1.5 ml-1">
              Student Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8a8a7a]">
                <Mail size={16} />
              </div>
              <input
                id="email-input"
                type="email"
                required
                placeholder="student.name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#f5f5f0] border border-[#e5e5d1] rounded-2xl focus:border-[#5A5A40] focus:bg-white focus:outline-none transition-all text-sm text-[#3d3d33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#7a7a6a] uppercase tracking-widest mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8a8a7a]">
                <Lock size={16} />
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-[#f5f5f0] border border-[#e5e5d1] rounded-2xl focus:border-[#5A5A40] focus:bg-white focus:outline-none transition-all text-sm text-[#3d3d33]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8a8a7a] hover:text-[#5A5A40] cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="submit-auth-btn"
            className="w-full mt-6 py-3.5 px-4 bg-[#5A5A40] hover:bg-[#4a4a34] text-white text-xs font-bold tracking-widest uppercase rounded-2xl hover:shadow-lg hover:shadow-[#5A5A40]/10 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {isLogin ? (
              <>
                <span>Sign In Securely</span>
                <LogIn size={15} className="text-[#D4A373]" />
              </>
            ) : (
              <>
                <span>Register & Simulate</span>
                <UserPlus size={15} className="text-[#D4A373]" />
              </>
            )}
          </button>
        </form>

        {/* Toggle link */}
        <div className="mt-8 text-center text-xs text-[#7a7a6a]">
          {isLogin ? (
            <p>
              Don't have a test profile?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                className="text-[#D4A373] font-bold hover:underline cursor-pointer"
              >
                Simulate New Account
              </button>
            </p>
          ) : (
            <p>
              Already configured mock registration?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                className="text-[#D4A373] font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* Privacy Note */}
        <div className="mt-6 border-t border-[#f0f0e8] pt-4 text-center">
          <p className="text-[10px] text-[#8a8a7a] leading-normal">
            No real Supabase backend connection is established yet. Any credentials specified will be verified immediately inside regional browser simulation state.
          </p>
        </div>
      </div>
    </div>
  );
}
