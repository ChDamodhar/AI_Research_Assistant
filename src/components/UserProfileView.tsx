/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, User, Mail, ShieldAlert, LogOut, CheckCircle2, 
  Terminal, ShieldCheck, LayoutDashboard, BookOpen, UploadCloud, UserCircle,
  Lock, Loader2, AlertCircle
} from 'lucide-react';
import { UserProfileType } from '../types';
import { updateProfile, changePassword } from '../api';

interface UserProfileViewProps {
  user: UserProfileType;
  onUpdateUser: (updatedUser: UserProfileType) => void;
  onLogout: () => void;
  onSelectScreen: (screen: 'DASHBOARD' | 'MY_PAPERS' | 'USER_PROFILE' | 'ADMIN_DASHBOARD') => void;
}

export default function UserProfileView({ user, onUpdateUser, onLogout, onSelectScreen }: UserProfileViewProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');

    try {
      // Call backend to update profile name
      await updateProfile(fullName);
      
      onUpdateUser({
        ...user,
        fullName,
        email,
        role
      });
      
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile. Check backend connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      // Update the profile text
      onUpdateUser({
        ...user,
        lastChangedPasswordText: `Password last changed on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      });

      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Password change failed. Verify your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-paper text-brand-slate font-sans selection:bg-brand-teal-light/30 flex flex-col justify-between">
      
      {/* Top Header App Bar */}
      <header className="fixed top-0 w-full z-45 bg-white border-b border-outline-variant flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => onSelectScreen('DASHBOARD')}
            className="w-8 h-8 rounded-full hover:bg-bg-paper flex items-center justify-center text-brand-slate active:scale-95 duration-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-sans text-lg font-bold tracking-tight text-brand-slate">Researcher Profile</span>
        </div>
        <button 
          onClick={onLogout}
          className="text-red-500 hover:text-red-700 p-2 rounded-full cursor-pointer hover:bg-red-50 flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Exit</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-grow pt-20 pb-24 px-4 max-w-2xl mx-auto w-full">
        
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm space-y-6"
        >
          {/* Avatar Profile Section */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-teal-light shrink-0 relative">
              <img 
                alt="Doctor Profile Avatar" 
                src="https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-sans text-md font-bold text-brand-slate">{fullName}</h3>
              <p className="font-mono text-[10px] text-brand-teal font-extrabold uppercase tracking-widest">{role}</p>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="space-y-4">
            
            {isSaved && (
              <div className="p-3 bg-brand-teal/10 text-brand-cyan-dark border border-brand-teal-light rounded-lg text-xs font-semibold flex items-center gap-1.5 animation: fade-in 0.2s">
                <CheckCircle2 className="w-4.5 h-4.5 text-brand-teal" />
                <span>Profile options updated successfully.</span>
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Input Full Name */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase tracking-wider text-outline block font-bold">Researcher Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded bg-bg-paper border border-outline-variant font-sans text-xs focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none text-brand-slate"
                  placeholder="Dr. Julia Thorne"
                  required
                />
              </div>
            </div>

            {/* Input Email Address */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase tracking-wider text-outline block font-bold">Institutional Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded bg-bg-paper border border-outline-variant font-sans text-xs focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none text-brand-slate"
                  placeholder="researcher@university.edu"
                  required
                />
              </div>
            </div>

            {/* Input Academic Role */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase tracking-wider text-outline block font-bold">Registry Role</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 px-3 rounded bg-bg-paper border border-outline-variant font-sans text-xs focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none text-brand-slate"
              >
                <option value="Senior Researcher">Senior Researcher</option>
                <option value="Principal Advisor">Principal Advisor</option>
                <option value="Doctoral Candidate">Doctoral Candidate</option>
                <option value="Undergraduate Intern">Undergraduate Intern</option>
                <option value="Contributing Scholar">Contributing Scholar</option>
                <option value="System Administrator">System Administrator</option>
              </select>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSaving}
                className="w-full bg-brand-slate text-white h-11 rounded font-sans font-semibold hover:opacity-95 text-xs transition-opacity cursor-pointer flex items-center justify-center gap-1 disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Modifications</span>
                )}
              </motion.button>
            </div>
          </form>

          {/* Password Change Section */}
          <div className="border-t border-outline-variant pt-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4.5 h-4.5 text-brand-teal" />
              <h4 className="font-sans font-bold text-sm text-brand-slate">Change Password</h4>
            </div>

            {passwordSuccess && (
              <div className="p-3 mb-3 bg-brand-teal/10 text-brand-cyan-dark border border-brand-teal-light rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-teal" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 mb-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase tracking-wider text-outline block font-bold">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 rounded bg-bg-paper border border-outline-variant font-sans text-xs focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none text-brand-slate"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase tracking-wider text-outline block font-bold">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 rounded bg-bg-paper border border-outline-variant font-sans text-xs focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none text-brand-slate"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-[9px] uppercase tracking-wider text-outline block font-bold">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                  <input 
                    type="password" 
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 rounded bg-bg-paper border border-outline-variant font-sans text-xs focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none text-brand-slate"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-white border border-outline-variant text-brand-slate h-11 rounded font-sans font-semibold hover:bg-bg-paper text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-teal" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-brand-teal" />
                    <span>Update Password</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* Secure lock status banner */}
          <div className="border border-outline-variant bg-bg-paper p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-teal shrink-0" />
              <h4 className="font-mono text-[10px] text-brand-slate uppercase font-bold tracking-wider">Access Security Status</h4>
            </div>
            <p className="font-sans text-[11px] text-on-surface-variant font-medium leading-relaxed">
              Your security configuration context is synchronized with your institutional SSO client. {user.lastChangedPasswordText}.
            </p>
          </div>
        </motion.div>

        {/* Dynamic Diagnostics terminal as specified in visual elements */}
        <div className="mt-6 border border-outline-variant p-4 rounded-xl bg-white shadow-xs font-mono text-[10px] text-on-surface-variant space-y-2">
          <div className="flex items-center gap-2 text-brand-slate border-b border-outline-variant/60 pb-2 mb-2">
            <Terminal className="w-4 h-4 text-brand-teal" />
            <span className="font-bold">INSIGHT AI DIAGNOSTIC NODE</span>
          </div>
          <div className="flex justify-between">
            <span>Terminal Version:</span> 
            <span className="text-brand-slate font-bold">{user.version}</span>
          </div>
          <div className="flex justify-between">
            <span>Server Route status:</span> 
            <span className="text-brand-teal font-extrabold">SSL ONLINE SECURE</span>
          </div>
          <div className="flex justify-between">
            <span>API Gateway Mode:</span> 
            <span className="text-brand-slate font-bold">@google/genai TS-SDK v3.5</span>
          </div>
        </div>

      </main>

      {/* Shared Bottom Navigation Drawer */}
      <nav className="fixed bottom-0 w-full z-45 bg-white border-t border-outline-variant flex justify-around items-center h-16 w-full px-4">
        <button 
          onClick={() => onSelectScreen('DASHBOARD')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-brand-slate rounded-xl px-4 py-1.5 cursor-pointer font-sans transition-all"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-mono text-[9px] mt-0.5 uppercase tracking-wide">Dashboard</span>
        </button>

        <button 
          onClick={() => onSelectScreen('MY_PAPERS')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-brand-slate rounded-xl px-4 py-1.5 cursor-pointer font-sans transition-all"
        >
          <BookOpen className="w-5 h-5" />
          <span className="font-mono text-[9px] mt-0.5 uppercase tracking-wide">My Papers</span>
        </button>

        <button 
          onClick={() => onSelectScreen('MY_PAPERS')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-brand-slate rounded-xl px-4 py-1.5 cursor-pointer font-sans transition-all"
        >
          <UploadCloud className="w-5 h-5" />
          <span className="font-mono text-[9px] mt-0.5 uppercase tracking-wide">Upload</span>
        </button>

        {/* Selected tab */}
        <button 
          onClick={() => onSelectScreen('USER_PROFILE')}
          className="flex flex-col items-center justify-center text-brand-teal bg-brand-teal-light/10 rounded-xl px-4 py-1.5 cursor-pointer font-sans transition-all"
        >
          <UserCircle className="w-5 h-5" />
          <span className="font-mono text-[9px] font-semibold mt-0.5 uppercase tracking-wide">Profile</span>
        </button>
      </nav>

    </div>
  );
}
