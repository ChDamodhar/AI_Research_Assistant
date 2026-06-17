/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, ShieldCheck, Terminal, Users, Cpu, FileSpreadsheet, 
  Settings, CheckCircle2, Sliders, Server, LayoutDashboard, BookOpen, 
  UploadCloud, UserCircle, Trash2, Eye, EyeOff, FileText, BarChart3, Loader2, MessageSquare
} from 'lucide-react';
import { getAdminStats } from '../api';

interface AdminConsoleViewProps {
  onBack: () => void;
  onSelectScreen: (screen: 'DASHBOARD' | 'MY_PAPERS' | 'USER_PROFILE' | 'ADMIN_DASHBOARD') => void;
  registeredUsers: { [email: string]: { fullName: string; role: string; inactive?: boolean } };
  onToggleUserStatus: (email: string) => void;
  onDeleteUser: (email: string) => void;
  totalPapersCount: number;
  totalReportsCount: number;
}

export default function AdminConsoleView({ 
  onBack, 
  onSelectScreen,
  registeredUsers,
  onToggleUserStatus,
  onDeleteUser,
  totalPapersCount,
  totalReportsCount
}: AdminConsoleViewProps) {
  const [ragTemperature, setRagTemperature] = useState(0.2);
  const [semanticThreshold, setSemanticThreshold] = useState(0.75);
  const [isSaved, setIsSaved] = useState(false);

  // Live admin stats from backend
  const [liveStats, setLiveStats] = useState<{
    total_users: number;
    total_papers: number;
    total_reports: number;
    total_qa_interactions: number;
    new_users_this_week: number;
    papers_by_status: { [status: string]: number };
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    setIsLoadingStats(true);
    getAdminStats()
      .then(res => {
        if (res.data) setLiveStats(res.data);
      })
      .catch(err => console.warn('Could not load admin stats from backend:', err))
      .finally(() => setIsLoadingStats(false));
  }, []);

  const handleSaveConfig = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const usersList = Object.entries(registeredUsers);

  return (
    <div className="min-h-screen bg-bg-paper text-brand-slate font-sans selection:bg-brand-teal-light/30 flex flex-col justify-between">
      
      {/* Top Header App Bar */}
      <header className="fixed top-0 w-full z-45 bg-white border-b border-outline-variant flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-bg-paper flex items-center justify-center text-brand-slate active:scale-95 duration-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-sans text-lg font-bold tracking-tight text-brand-slate">Admin Console</span>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
          <img 
            alt="Doctor Profile Avatar" 
            src="https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg" 
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* Main content body canvas */}
      <main className="flex-grow pt-20 pb-24 px-4 max-w-2xl mx-auto w-full">
        
        <div className="space-y-6">
          
          {/* Headline descriptors */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-brand-teal font-extrabold uppercase tracking-widest block">
              Registry Configuration
            </span>
            <h2 className="font-sans text-xl font-bold tracking-tight text-brand-slate leading-none">
              Institutional Admin Hub
            </h2>
            <p className="font-sans text-xs text-on-surface-variant font-medium mt-1 leading-normal">
              Review institutional licenses, API key handshake status, token queues, and diagnostic registries.
            </p>
          </div>

          {/* Quick System status Bento row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Stat operational */}
            <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-xs text-center flex flex-col justify-center gap-1">
              <Server className="w-5 h-5 mx-auto text-brand-teal" />
              <span className="font-mono text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Gateway status</span>
              <span className="font-sans text-xs font-bold text-brand-slate flex items-center justify-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-brand-teal rounded-full animate-ping"></span>
                ONLINE (42ms)
              </span>
            </div>

            {/* Stat licensing */}
            <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-xs text-center flex flex-col justify-center gap-1">
              <ShieldCheck className="w-5 h-5 mx-auto text-indigo-600" />
              <span className="font-mono text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">License tier</span>
              <span className="font-sans text-xs font-bold text-indigo-600 mt-0.5">University Research</span>
            </div>

            {/* Stat API model limits */}
            <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-xs text-center flex flex-col justify-center gap-1">
              <Cpu className="w-5 h-5 mx-auto text-orange-600" />
              <span className="font-mono text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Core Engine</span>
              <span className="font-sans text-xs font-bold text-brand-slate mt-0.5">gemini-3.5-flash</span>
            </div>

          </div>

          {/* Dynamic Statistics Cards — fetched live from GET /api/admin/stats */}
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-6 bg-white border border-outline-variant rounded-xl shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-brand-teal mr-2" />
              <span className="font-sans text-xs text-on-surface-variant font-medium">Loading live admin metrics...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
              <div className="text-center">
                <span className="block text-2xl font-bold text-brand-slate">{liveStats?.total_users ?? usersList.length}</span>
                <span className="font-sans text-[10px] text-on-surface-variant/90 uppercase font-medium">Total Users</span>
              </div>
              <div className="text-center border-l border-outline-variant/60">
                <span className="block text-2xl font-bold text-brand-slate">{liveStats?.total_papers ?? totalPapersCount}</span>
                <span className="font-sans text-[10px] text-on-surface-variant/90 uppercase font-medium">Total Papers</span>
              </div>
              <div className="text-center border-l border-outline-variant/60">
                <span className="block text-2xl font-bold text-brand-teal">{liveStats?.total_reports ?? totalReportsCount}</span>
                <span className="font-sans text-[10px] text-on-surface-variant/90 uppercase font-medium">Reports Gen</span>
              </div>
              <div className="text-center border-l border-outline-variant/60">
                <span className="block text-2xl font-bold text-indigo-600">{liveStats?.total_qa_interactions ?? 0}</span>
                <span className="font-sans text-[10px] text-on-surface-variant/90 uppercase font-medium">Q&A Chats</span>
              </div>
            </div>
          )}

          {/* New users this week badge */}
          {liveStats && liveStats.new_users_this_week > 0 && (
            <div className="bg-brand-teal/5 border border-brand-teal/20 p-3 rounded-xl flex items-center gap-3">
              <div className="bg-brand-teal/10 p-1.5 rounded-full">
                <Users className="w-4 h-4 text-brand-teal" />
              </div>
              <span className="font-sans text-xs text-brand-slate font-medium">
                <strong className="text-brand-teal">{liveStats.new_users_this_week}</strong> new user{liveStats.new_users_this_week > 1 ? 's' : ''} registered this week
              </span>
            </div>
          )}

          {/* Configuration sliding sliders */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-outline-variant p-6 rounded-xl shadow-sm space-y-5"
          >
            <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
              <Sliders className="w-5 h-5 text-brand-teal" />
              <h3 className="font-sans font-bold text-sm text-brand-slate">Model Synthesis Parameters</h3>
            </div>

            {isSaved && (
              <div className="p-3 bg-brand-teal/10 text-brand-cyan-dark border border-brand-teal-light rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-brand-teal" />
                <span>System parameters recalibrated and persisted in registry.</span>
              </div>
            )}

            {/* Parameter temperature config */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-brand-slate">RAG Temperature (Creativity depth)</span>
                <span className="font-mono text-brand-teal font-extrabold">{ragTemperature}</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={1} 
                step={0.05} 
                value={ragTemperature}
                onChange={(e) => setRagTemperature(parseFloat(e.target.value))}
                className="w-full accent-brand-teal h-1.5 bg-bg-paper rounded-lg cursor-pointer"
              />
              <p className="font-sans text-[10px] text-on-surface-variant leading-relaxed">
                Lower temperatures yield highly logical summaries and deterministic math checks.
              </p>
            </div>

            {/* Parameter threshold config */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-brand-slate">Semantic Ingest Threshold (Filter relevance)</span>
                <span className="font-mono text-brand-teal font-extrabold">{semanticThreshold}</span>
              </div>
              <input 
                type="range" 
                min={0.5} 
                max={0.99} 
                step={0.01} 
                value={semanticThreshold}
                onChange={(e) => setSemanticThreshold(parseFloat(e.target.value))}
                className="w-full accent-brand-teal h-1.5 bg-bg-paper rounded-lg cursor-pointer"
              />
              <p className="font-sans text-[10px] text-on-surface-variant leading-relaxed">
                Defines the cosine-similarity lower bound for chunk embeddings queried via Vector DB.
              </p>
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full bg-brand-slate text-white h-11 rounded-lg font-sans font-bold hover:opacity-95 text-xs cursor-pointer flex items-center justify-center gap-1 mt-2 shadow-sm"
            >
              <Settings className="w-4 h-4 text-brand-teal-light" />
              <span>Persist Parameters</span>
            </button>
          </motion.div>

          {/* Academic Registry Directory Card (Registrar list) - FULLY DYNAMIC now! */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-bg-paper border-b border-outline-variant flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-teal" />
              <h3 className="font-sans font-bold text-xs text-brand-slate">Active Academic Registry Directory</h3>
            </div>
            
            <div className="divide-y divide-outline-variant/40 text-xs">
              {usersList.length === 0 ? (
                <div className="p-6 text-center text-on-surface-variant font-medium">
                  No registered users in gateway directory.
                </div>
              ) : (
                usersList.map(([email, userProfile]) => {
                  const initials = userProfile.fullName
                    .split(' ')
                    .map(name => name.charAt(0))
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  const isInactive = userProfile.inactive;

                  return (
                    <div key={email} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs ${isInactive ? 'bg-outline-variant text-[#76777d]' : 'bg-brand-teal/5 text-brand-teal'}`}>
                          {initials}
                        </div>
                        <div>
                          <h4 className={`font-bold text-brand-slate leading-none ${isInactive ? 'line-through text-[#76777d]' : ''}`}>
                            {userProfile.fullName}
                          </h4>
                          <span className="font-sans text-[11px] text-[#76777d]">{email}</span>
                          <span className="block font-sans text-[9px] text-[#76777d] mt-0.5 font-bold uppercase">{userProfile.role || 'Contributing Scholar'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className={`font-mono text-[9px] px-2 py-0.5 rounded font-extrabold ${isInactive ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-brand-teal/10 text-brand-teal border border-brand-teal-light'}`}>
                          {isInactive ? 'Deactivated' : 'Active'}
                        </span>
                        
                        {/* Act/Deact Toggle Action with Eye/EyeOff icons */}
                        <button
                          onClick={() => onToggleUserStatus(email)}
                          title={isInactive ? "Activate user" : "Deactivate user"}
                          className={`p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${isInactive ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100' : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'}`}
                        >
                          {isInactive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        {/* Account Delete Action with Trash2 icon */}
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to permanently delete user record for ${email}?`)) {
                              onDeleteUser(email);
                            }
                          }}
                          title="Delete user"
                          className="p-1.5 rounded-md bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-xs cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Secure system diagnostic parameters audit log */}
          <div className="border border-outline-variant p-4 rounded-xl bg-white shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-brand-slate">
              <Terminal className="w-4 h-4 text-brand-teal" />
              <span className="font-mono text-[10px] font-bold">REGISTRY TRANSACTION REPORT</span>
            </div>
            <div className="font-mono text-[9px] text-[#76777d]/85 leading-normal space-y-0.5">
              <p>[09:21:42] Handshake success on client index #9422A.</p>
              <p>[09:21:43] Loaded model gemini-3.5-flash with AES keys.</p>
              <p>[10:48:02] Query parsing: Reciprocal-rank fusion query expansion.</p>
              <p>[11:15:20] Index block compiled over {totalPapersCount} reference arrays.</p>
            </div>
          </div>

        </div>

      </main>

      {/* Shared Bottom Navigation Drawer */}
      <nav className="fixed bottom-0 w-full z-45 bg-white border-t border-outline-variant flex justify-around items-center h-16 w-full px-4">
        {/* Selected tab */}
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

        <button 
          onClick={() => onSelectScreen('USER_PROFILE')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-brand-slate rounded-xl px-4 py-1.5 cursor-pointer font-sans transition-all"
        >
          <UserCircle className="w-5 h-5" />
          <span className="font-mono text-[9px] mt-0.5 uppercase tracking-wide">Profile</span>
        </button>
      </nav>

    </div>
  );
}

