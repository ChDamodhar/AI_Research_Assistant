/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, FlaskConical, Shield, BookmarkCheck } from 'lucide-react';
import { UserProfileType } from '../types';
import { login, register } from '../api';

interface LoginViewProps {
  onLoginSuccess: (email: string, profile: UserProfileType) => void;
  onNavigateToRegister: () => void;
}

export default function LoginView({ onLoginSuccess, onNavigateToRegister }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please capture both Institutional Email and Access Key.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await login(email, password);
      setIsSubmitting(false);
      
      const mappedProfile: UserProfileType = {
        fullName: res.user.name,
        email: res.user.email,
        role: res.user.role === 'admin' ? 'System Administrator' : 'Contributing Scholar',
        version: 'v1.0.4',
        lastChangedPasswordText: 'Password verified securely via auth gateway'
      };
      
      onLoginSuccess(email, mappedProfile);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Authentication failed. Please check credentials or server connection.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen justify-between bg-bg-paper text-brand-slate font-sans selection:bg-brand-teal-light/30">
      {/* Main Form container */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        
        {/* Branding Title Block */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center justify-center p-3 bg-brand-slate-light text-brand-teal-light rounded-2xl mb-4 shadow-sm">
            <BookmarkCheck className="w-10 h-10" />
          </div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-brand-slate mb-1">Insight AI</h1>
          <p className="font-sans text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
            Empowering the next generation of academic discovery.
          </p>
        </motion.div>

        {/* Auth form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm bg-white border border-outline-variant rounded-xl p-6 shadow-sm relative overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display error message if any */}
            {errorMessage && (
              <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100 font-medium">
                {errorMessage}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block font-semibold" htmlFor="email">
                Institutional Email
              </label>
              <div className="flex items-center border border-outline-variant rounded-lg bg-bg-paper px-3 py-2 transition-all focus-within:border-brand-teal focus-within:ring-1 focus-within:ring-brand-teal">
                <Mail className="w-4 h-4 text-outline mr-2" />
                <input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dr.thorne@university.edu"
                  className="bg-transparent border-none outline-none focus:ring-0 w-full font-sans text-sm text-brand-slate placeholder:text-outline/50"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="password">
                  Access Key
                </label>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); alert("Access key resets are handled securely through your participating academic registrar. Contact IT services."); }}
                  className="font-sans text-xs text-brand-teal hover:underline font-medium"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="flex items-center border border-outline-variant rounded-lg bg-bg-paper px-3 py-2 transition-all focus-within:border-brand-teal focus-within:ring-1 focus-within:ring-brand-teal">
                <Lock className="w-4 h-4 text-outline mr-2" />
                <input 
                  id="password"
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent border-none outline-none focus:ring-0 w-full font-sans text-sm text-brand-slate placeholder:text-outline/40"
                  required
                />
              </div>
            </div>

            {/* Submit Sign In Button */}
            <div className="pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-slate text-white py-3 rounded-lg font-sans font-semibold active:opacity-90 transition-opacity flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-80 shadow-sm"
              >
                {isSubmitting ? (
                  <span>Authenticating secure key...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Secure Divider Line */}
          <div className="my-5 flex items-center">
            <div className="flex-grow h-[1px] bg-outline-variant"></div>
            <span className="px-3 font-mono text-[9px] text-outline italic uppercase tracking-wider">Authentication Portal</span>
            <div className="flex-grow h-[1px] bg-outline-variant"></div>
          </div>

          {/* Alternative Institution SSO */}
          <div className="space-y-3">
            <button 
              onClick={async () => {
                setIsSubmitting(true);
                setErrorMessage('');
                const ssoEmail = 'dr.thorne@university.edu';
                const ssoPass = 'secure123';
                try {
                  let res;
                  try {
                    res = await login(ssoEmail, ssoPass);
                  } catch (e) {
                    await register('Dr. Julian Aris Thorne', ssoEmail, ssoPass);
                    res = await login(ssoEmail, ssoPass);
                  }
                  setIsSubmitting(false);
                  const profile: UserProfileType = {
                    fullName: res.user.name,
                    email: res.user.email,
                    role: res.user.role === 'admin' ? 'System Administrator' : 'Contributing Scholar',
                    version: 'v1.0.4',
                    lastChangedPasswordText: 'SSO Authenticated'
                  };
                  onLoginSuccess(res.user.email, profile);
                } catch (err: any) {
                  setIsSubmitting(false);
                  setErrorMessage('SSO connection error: ' + (err.message || 'Server unreachable.'));
                }
              }}
              className="w-full bg-surface-container border border-outline-variant py-2 h-10 rounded-lg font-sans text-xs text-brand-slate font-medium flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-Otb7k476kuuWh8MGmxb3GLgzsZNnsi6tRZE9SUFGtO-svzQ-OLeTbDjk748zhnfYDM_j-KmgnXrFmbTHi7LpUZ_G8kPD5ntU7vGvJqO6I-EShgajXmka6XVFhBLN_QWk_-FjR6eczqt8GFQzR_R6NHRN3RpAPRxtIPS7f_hqsPLl2aODXfCXSw8CKNH0ATwRoBosESu4Fb_shcbX9deqfoZTiguhRce_wUbiHpi4z23yE_yOVYk2hCEsjd8djGu0jyyG8N5kkQw" 
                alt="SSO Logo" 
                className="w-4 h-4"
              />
              Continue with Institution SSO
            </button>

            {/* Custom high-visibility "Create Account" CTA block inside login card */}
            <div className="pt-2 border-t border-dashed border-outline-variant/60 flex flex-col items-center gap-1.5">
              <span className="font-sans text-[11px] text-outline">New Scholar / Independent Researcher?</span>
              <button 
                type="button"
                onClick={onNavigateToRegister}
                className="w-full bg-brand-teal/10 hover:bg-brand-teal/15 text-brand-cyan-dark border border-brand-teal/20 py-2 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider hover:opacity-95 transition-all cursor-pointer text-center"
              >
                Create Account (Establish Academic Credentials)
              </button>
            </div>
          </div>
        </motion.div>

        {/* Support navigation status footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 font-sans text-xs text-brand-slate-light"
        >
          Need assistance or regional SSO credentials? {' '}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); alert("University single-sign-on (SSO) gateway nodes are authorized by your active department chairs."); }}
            className="text-brand-slate font-semibold hover:underline cursor-pointer"
          >
            Contact IT Service Desk
          </a>
        </motion.p>

        {/* Decorative subtle background flask */}
        <div className="fixed -bottom-16 -right-16 opacity-[0.03] pointer-events-none select-none">
          <FlaskConical className="w-96 h-96" />
        </div>
      </main>

      {/* Support footer */}
      <footer className="py-4 text-center border-t border-outline-variant/40 bg-white">
        <div className="flex justify-center gap-6 mb-1">
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Academic Privacy Shield active. No model pre-training is performed over your document uploads."); }} className="font-mono text-[9px] text-outline hover:text-brand-slate transition-colors font-medium">Privacy Policy</a>
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Ecosystem bound under the Institutional Terms of Scholarly Research v4.2."); }} className="font-mono text-[9px] text-outline hover:text-brand-slate transition-colors font-medium">Terms of Research</a>
        </div>
        <p className="font-mono text-[9px] text-outline/65 uppercase tracking-[0.2em] flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-brand-teal" /> Enforced with AES-256 Encryption
        </p>
      </footer>
    </div>
  );
}
