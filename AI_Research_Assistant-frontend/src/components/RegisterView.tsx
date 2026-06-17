/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, User, Mail, Lock, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { register, login } from '../api';
import { UserProfileType } from '../types';

interface RegisterViewProps {
  onRegisterSuccess: (email: string, profile: UserProfileType) => void;
  onNavigateToLogin: () => void;
}

export default function RegisterView({ onRegisterSuccess, onNavigateToLogin }: RegisterViewProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg('Please encapsulate all requested registration fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('passwords do not match');
      return;
    }
    if (!agree) {
      setErrorMsg('You must agree to the Terms of Service to establish credentials.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Call register
      await register(fullName, email, password);
      // 2. Call login to persist token
      const loginRes = await login(email, password);
      setIsSubmitting(false);

      const mappedProfile: UserProfileType = {
        fullName: loginRes.user.name,
        email: loginRes.user.email,
        role: loginRes.user.role === 'admin' ? 'System Administrator' : 'Contributing Scholar',
        version: 'v1.0.4',
        lastChangedPasswordText: 'Password last set during secure registration'
      };

      onRegisterSuccess(email, mappedProfile);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Registration failed. Server could not be reached.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-paper text-brand-slate font-sans selection:bg-brand-teal-light/30 relative overflow-hidden flex flex-col justify-between">
      
      {/* Absolute Backdrop shapes as styled in layout design principles */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-surface-container-high rounded-full blur-3xl -z-10 opacity-60"></div>
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-brand-teal-light/20 rounded-full blur-3xl -z-10 opacity-40"></div>

      {/* Top Bar with back arrow navigation */}
      <header className="fixed top-0 w-full z-50 bg-white border-b border-outline-variant flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onNavigateToLogin}
            className="w-8 h-8 rounded-full hover:bg-bg-paper flex items-center justify-center text-brand-slate active:scale-95 duration-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-brand-slate">Insight AI</span>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
          <img 
            alt="Researcher avatar" 
            src="https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg" 
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow pt-24 pb-8 px-4 flex flex-col items-center justify-center">
        
        {/* Register Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white border border-outline-variant rounded-xl p-6 shadow-sm relative"
        >
          {/* Headline Title */}
          <div className="mb-6 text-center">
            <h2 className="font-sans text-xl font-bold tracking-tight text-brand-slate mb-1">Create Account</h2>
            <p className="font-sans text-xs text-on-surface-variant font-medium">Join the next generation of academic discovery.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            
            {errorMsg && (
              <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Field Name */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase tracking-wider text-outline block font-bold">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded bg-bg-paper border border-outline-variant font-sans text-sm text-brand-slate focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none transition-all"
                  placeholder="Dr. Julian Thorne"
                  required
                />
              </div>
            </div>

            {/* Field Email */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase tracking-wider text-outline block font-bold">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded bg-bg-paper border border-outline-variant font-sans text-sm text-brand-slate focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none transition-all"
                  placeholder="researcher@university.edu"
                  required
                />
              </div>
            </div>

            {/* Field Password */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase tracking-wider text-outline block font-bold">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded bg-bg-paper border border-outline-variant font-sans text-sm text-brand-slate focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Field Confirm Password */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase tracking-wider text-outline block font-bold">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded bg-bg-paper border border-outline-variant font-sans text-sm text-brand-slate focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Terms and Privacy Agreement checkbox */}
            <div className="flex items-start gap-2 pt-2">
              <input 
                type="checkbox"
                id="agree"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 rounded-sm border-outline-variant text-brand-teal focus:ring-brand-teal w-4 h-4"
              />
              <label htmlFor="agree" className="font-sans text-xs text-on-surface-variant leading-snug cursor-pointer select-none">
                I agree to the <span className="text-brand-teal font-medium hover:underline">Terms of Service</span> and <span className="text-brand-teal font-medium hover:underline">Privacy Policy</span> regarding my research data.
              </label>
            </div>

            {/* Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-slate text-white h-11 mt-2 rounded font-sans font-semibold active:scale-95 duration-200 hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
            >
              {isSubmitting ? (
                <span>Generating research keys...</span>
              ) : (
                <>
                  <span>Register</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Prompt navigating back to Login */}
          <div className="mt-6 pt-4 border-t border-outline-variant text-center">
            <p className="font-sans text-xs text-on-surface-variant">
              Already have an account?{''}{' '}
              <button 
                type="button"
                onClick={onNavigateToLogin}
                className="text-brand-teal font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        </motion.div>

        {/* Enterprise Security banner */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-md w-full opacity-90"
        >
          <div className="bg-brand-teal/5 border border-brand-teal/20 p-4 rounded-xl flex items-center gap-4">
            <div className="bg-brand-teal/10 p-2 rounded-full text-brand-teal shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h4 className="font-mono text-[10px] text-brand-teal font-bold uppercase tracking-wider">Enterprise Security</h4>
              <p className="font-sans text-[11px] text-on-surface-variant leading-normal">
                Your intellectual property is encrypted with AES-256 standard and never utilized for base foundation model pre-training.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="py-4 text-center border-t border-outline-variant/40 bg-white">
        <p className="font-mono text-[9px] text-[#76777d]/70 uppercase tracking-widest">Insight AI Security Shield • AES-256 Enabled</p>
      </footer>
    </div>
  );
}
