/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError('Please fill in all standard credentials.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address, for example name@gmail.com.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        if (data.user) {
          onSuccess(cleanEmail);
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.user) {
          if (data.session) {
            setSuccessMsg('Account registered successfully. Logging you in...');
            setTimeout(() => {
              onSuccess(cleanEmail);
            }, 700);
          } else {
            setSuccessMsg('Account registered successfully. Please check your email to confirm your account, then sign in.');
            setIsLogin(true);
          }
        } else {
          setError('Registration failed. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-signup-page" className="min-h-screen bg-[#fdfcf8] text-[#3d3d33] flex items-center justify-center p-6 relative font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#5A5A40]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4A373]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-white rounded-[32px] p-6 sm:p-10 shadow-xl border border-[#e5e5d1] z-10 flex flex-col justify-between"
      >
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={loading}
            className="p-2 ml-[-8px] text-[#7a7a6a] hover:text-[#5A5A40] hover:bg-[#f5f5f0] rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <span className="text-xs font-bold text-[#5A5A40] font-mono tracking-wider bg-[#f5f5f0] border border-[#e5e5d1] px-2 py-0.5 rounded-md">
            SUPABASE AUTH
          </span>
        </div>

        <div className="text-center mb-8">
          <span className="text-3xl font-serif italic text-[#5A5A40] tracking-tight block">
            {isLogin ? 'Welcome Back' : 'Join DuitWise'}
          </span>
          <p className="text-[#8a8a7a] text-xs mt-2 max-w-xs mx-auto leading-relaxed">
            {isLogin
              ? 'Sign in to continue tracking your student allowance survival status.'
              : 'Create an account using Supabase authentication.'}
          </p>
        </div>

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
                disabled={loading}
                placeholder="student.name@gmail.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#f5f5f0] border border-[#e5e5d1] rounded-2xl focus:border-[#5A5A40] focus:bg-white focus:outline-none transition-all text-sm text-[#3d3d33] disabled:opacity-50"
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
                disabled={loading}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-[#f5f5f0] border border-[#e5e5d1] rounded-2xl focus:border-[#5A5A40] focus:bg-white focus:outline-none transition-all text-sm text-[#3d3d33] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8a8a7a] hover:text-[#5A5A40] cursor-pointer disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="submit-auth-btn"
            disabled={loading}
            className={`w-full mt-6 py-3.5 px-4 bg-[#5A5A40] text-white text-xs font-bold tracking-widest uppercase rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
              loading
                ? 'opacity-75 cursor-not-allowed'
                : 'hover:bg-[#4a4a34] hover:shadow-lg hover:shadow-[#5A5A40]/10 cursor-pointer'
            }`}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isLogin ? (
              <>
                <span>Sign In Securely</span>
                <LogIn size={15} className="text-[#D4A373]" />
              </>
            ) : (
              <>
                <span>Register Account</span>
                <UserPlus size={15} className="text-[#D4A373]" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-[#7a7a6a]">
          {isLogin ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                  setSuccessMsg('');
                }}
                disabled={loading}
                className="text-[#D4A373] font-bold hover:underline cursor-pointer disabled:opacity-50"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setSuccessMsg('');
                }}
                disabled={loading}
                className="text-[#D4A373] font-bold hover:underline cursor-pointer disabled:opacity-50"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

        <div className="mt-6 border-t border-[#f0f0e8] pt-4 text-center">
          <p className="text-[10px] text-[#8a8a7a] leading-normal">
            Secured using Supabase email and password authentication. Passwords are handled by Supabase Auth.
          </p>
        </div>
      </motion.div>
    </div>
  );
}