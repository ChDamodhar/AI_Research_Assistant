/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Menu, FileText, BarChart3, ChevronRight, Sparkles, LayoutDashboard, 
  BookOpen, UploadCloud, UserCircle, FlaskConical, Award, Terminal
} from 'lucide-react';
import { Paper, UserProfileType, Activity } from '../types';

interface DashboardViewProps {
  user: UserProfileType;
  papers: Paper[];
  activities: Activity[];
  onSelectScreen: (screen: 'DASHBOARD' | 'MY_PAPERS' | 'USER_PROFILE' | 'ADMIN_DASHBOARD') => void;
  onSelectPaper: (paperId: string) => void;
  onUploadClicked: () => void;
}

export default function DashboardView({ 
  user, 
  papers, 
  activities,
  onSelectScreen, 
  onSelectPaper, 
  onUploadClicked 
}: DashboardViewProps) {
  
  // Quick navigation to specific papers from the activity feed
  const handleActivityClick = (filename: string) => {
    if (filename.includes("Transformer") || filename.includes("Attention")) {
      onSelectPaper('attention-is-all-you-need');
    } else if (filename.includes("BERT")) {
      onSelectPaper('bert-pre-training');
    } else if (filename.includes("Genomic") || filename.includes("Scalable")) {
      onSelectPaper('scalable-neural-architecture-search');
    } else {
      onSelectScreen('MY_PAPERS');
    }
  };

  const reportsCount = activities.filter(a => a.type === 'report').length;

  return (
    <div className="min-h-screen bg-bg-paper text-brand-slate font-sans selection:bg-brand-teal-light/30 flex flex-col justify-between">
      
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-white border-b border-outline-variant flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => onSelectScreen('ADMIN_DASHBOARD')}
            className="text-brand-slate hover:text-brand-teal active:scale-95 duration-200 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-sans text-lg font-bold tracking-tight text-brand-slate flex items-center gap-1.5">
            Insight AI
          </span>
        </div>
        <button 
          onClick={() => onSelectScreen('USER_PROFILE')}
          className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant focus:outline-none cursor-pointer"
        >
          <img 
            alt="Doctor Avatar" 
            src="https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg" 
            className="w-full h-full object-cover"
          />
        </button>
      </header>

      {/* Main Content Scroll Canvas */}
      <main className="flex-grow pt-20 pb-24 px-4 max-w-2xl mx-auto w-full">
        
        {/* Welcome Block section */}
        <section className="mb-6">
          <h2 className="font-sans text-xl font-bold tracking-tight text-[#0a1120] mb-0.5">Research Overview</h2>
          <p className="font-sans text-xs text-on-surface-variant font-medium">Welcome back, {user.fullName}.</p>
        </section>

        {/* Bento Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          
          {/* Stat total CARD */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white border border-outline-variant p-4 rounded-xl flex flex-col justify-between h-32 shadow-sm font-sans"
          >
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Total</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-slate leading-none">{papers.length}</div>
              <div className="text-xs text-on-surface-variant font-medium mt-1">Papers Uploaded</div>
            </div>
          </motion.div>

          {/* Stat insights CARD with teal highlighting */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white border border-outline-variant border-l-4 border-l-brand-teal-light p-4 rounded-xl flex flex-col justify-between h-32 shadow-sm font-sans"
          >
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-lg bg-brand-teal/5 text-brand-teal flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Insights</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-slate leading-none">{reportsCount}</div>
              <div className="text-xs text-on-surface-variant font-medium mt-1">Reports Generated</div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity Asymmetric Feed list */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans text-md font-bold tracking-tight text-brand-slate">Recent Activity</h3>
            <button 
              type="button"
              onClick={() => onSelectScreen('MY_PAPERS')}
              className="text-brand-teal font-mono text-[10px] font-bold uppercase tracking-wider hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {activities.length === 0 ? (
              <div className="bg-white border border-outline-variant p-6 rounded-xl text-center text-xs text-on-surface-variant font-semibold">
                No recent activities. Upload a paper or start Q&A to track session analytics.
              </div>
            ) : (
              activities.slice(0, 4).map(act => {
                let icon = <Award className="w-5 h-5" />;
                let bgStyle = "bg-brand-teal/5 text-brand-teal";
                if (act.type === 'upload') {
                  icon = <UploadCloud className="w-5 h-5" />;
                  bgStyle = "bg-blue-50 text-blue-600";
                } else if (act.type === 'report') {
                  icon = <FileText className="w-5 h-5" />;
                  bgStyle = "bg-orange-50 text-orange-600";
                } else if (act.type === 'qna') {
                  icon = <Sparkles className="w-5 h-5" />;
                  bgStyle = "bg-purple-50 text-purple-600";
                } else if (act.type === 'analysis') {
                  icon = <FlaskConical className="w-5 h-5" />;
                  bgStyle = "bg-pink-50 text-pink-600";
                }

                return (
                  <motion.div 
                    key={act.id}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      if (act.paperId) {
                        onSelectPaper(act.paperId);
                      } else {
                        onSelectScreen('MY_PAPERS');
                      }
                    }}
                    className="bg-white border border-outline-variant p-4 rounded-xl flex items-center gap-3 shadow-xs hover:border-brand-teal/40 transition-colors cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bgStyle}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans text-sm font-semibold text-brand-slate truncate">{act.title}</h4>
                      <p className="font-sans text-xs text-on-surface-variant font-medium">{act.timestamp}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-outline" />
                  </motion.div>
                );
              })
            )}
          </div>
        </section>

        {/* Quick Action Highlight banner */}
        <section>
          <div className="relative overflow-hidden rounded-xl bg-brand-slate-light p-4 text-white shadow-sm border border-brand-slate">
            <div className="relative z-10 max-w-[80%]">
              <h4 className="font-sans font-bold text-sm mb-1">New Paper Analysis</h4>
              <p className="font-sans text-xs text-[#a0aec0] mb-3 leading-relaxed">
                Leverage our new GPT-4o optimized research engine for faster summaries, citation mapping, and final reports.
              </p>
              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={onUploadClicked}
                className="bg-brand-teal text-white px-4 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider hover:opacity-95 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                START ANALYSING
              </motion.button>
            </div>
            
            {/* Background design accents */}
            <div className="absolute right-[-20px] top-[-20px] opacity-[0.08] pointer-events-none select-none text-white">
              <FlaskConical className="w-36 h-36" />
            </div>
          </div>
        </section>

        {/* Bottom decorative diagnostic panel signature as described in Design Philosophy checks */}
        <div className="mt-8 flex items-center justify-between border border-outline-variant/60 rounded-lg p-2 px-3 bg-white font-mono text-[9px] text-outline">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-brand-teal" />
            <span>Handshake: SSL SECURE SESSION</span>
          </div>
          <span>v1.0.4 - LIVE STATE</span>
        </div>

      </main>

      {/* Global Shared Bottom Nav Drawer */}
      <nav className="fixed bottom-0 w-full z-50 bg-white border-t border-outline-variant flex justify-around items-center h-16 px-4">
        {/* Active tab */}
        <button 
          onClick={() => onSelectScreen('DASHBOARD')}
          className="flex flex-col items-center justify-center text-brand-teal bg-brand-teal-light/10 rounded-xl px-4 py-1.5 cursor-pointer font-sans transition-all"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-mono text-[9px] font-semibold mt-0.5 uppercase tracking-wide">Dashboard</span>
        </button>

        <button 
          onClick={() => onSelectScreen('MY_PAPERS')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-brand-slate rounded-xl px-4 py-1.5 cursor-pointer font-sans transition-all"
        >
          <BookOpen className="w-5 h-5" />
          <span className="font-mono text-[9px] mt-0.5 uppercase tracking-wide">My Papers</span>
        </button>

        <button 
          onClick={onUploadClicked}
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
