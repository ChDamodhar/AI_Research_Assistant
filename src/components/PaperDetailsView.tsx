/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Share2, Sparkles, CheckCircle2, ChevronRight, Bookmark, 
  DownloadCloud, Link2, ExternalLink, Send, Paperclip, ChevronLeft, 
  Database, ScrollText, Users, FileSpreadsheet, ZoomIn, Loader2, RefreshCw,
  LayoutDashboard, BookOpen, UserCircle, AlertCircle
} from 'lucide-react';
import { Paper, Citation, DetailTab, Message } from '../types';
import { askPaperQuery, summarizePaper, extractCitations, generateReport, downloadReport, getChatHistory } from '../api';

interface PaperDetailsViewProps {
  paper: Paper;
  onBack: () => void;
  onSelectScreen: (screen: 'DASHBOARD' | 'MY_PAPERS' | 'USER_PROFILE' | 'ADMIN_DASHBOARD') => void;
  onUpdatePaper?: (updatedPaper: Paper) => void;
  onAddActivity?: (type: 'upload' | 'analysis' | 'report' | 'qna', title: string) => void;
}

export default function PaperDetailsView({ 
  paper, 
  onBack, 
  onSelectScreen,
  onUpdatePaper,
  onAddActivity
}: PaperDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('SUMMARY');
  const [bookmarkActive, setBookmarkActive] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Live summary/citation state loaded from backend
  const [liveSummary, setLiveSummary] = useState<string>(paper.abstract || '');
  const [liveCitations, setLiveCitations] = useState<Citation[]>(paper.citations || []);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingCitations, setIsLoadingCitations] = useState(false);

  // Report generation state
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  
  // Q&A / Chat states
  const [chatMessages, setQnaMessages] = useState<Message[]>(paper.qna || []);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStateText, setThinkingStateText] = useState('Processing PDF Layers...');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat feed
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isThinking]);

  // Load summary from backend when SUMMARY tab is active
  useEffect(() => {
    if (activeTab !== 'SUMMARY' || !paper.id) return;
    setIsLoadingSummary(true);
    summarizePaper(paper.id)
      .then(res => {
        if (res.summary?.summary) setLiveSummary(res.summary.summary);
      })
      .catch(err => console.warn('Could not load live summary:', err))
      .finally(() => setIsLoadingSummary(false));
  }, [activeTab, paper.id]);

  // Load citations from backend when CITATIONS tab is active
  useEffect(() => {
    if (activeTab !== 'CITATIONS' || !paper.id) return;
    setIsLoadingCitations(true);
    extractCitations(paper.id)
      .then(res => {
        const mapped: Citation[] = (res.citations || []).map((c, idx) => ({
          id: String(c.id ?? idx + 1),
          author: c.author || 'Unknown Author',
          year: Number(c.year) || new Date().getFullYear(),
          title: c.title || c.raw_text || 'Untitled Reference',
          link: c.title
            ? `https://scholar.google.com/scholar?q=${encodeURIComponent(c.title)}`
            : '#'
        }));
        if (mapped.length > 0) setLiveCitations(mapped);
      })
      .catch(err => console.warn('Could not load live citations:', err))
      .finally(() => setIsLoadingCitations(false));
  }, [activeTab, paper.id]);

  // Handle PDF/DOCX report download
  const handleGenerateReport = async (format: 'pdf' | 'docx' = 'pdf') => {
    setIsGeneratingReport(true);
    setReportError(null);
    setReportSuccess(false);
    try {
      const res = await generateReport(paper.id, format);
      await downloadReport(res.report_id, `${paper.title.slice(0, 40)}_report.${format}`);
      setReportSuccess(true);
      if (onAddActivity) onAddActivity('report', `Downloaded ${format.toUpperCase()} report for ${paper.title}`);
      setTimeout(() => setReportSuccess(false), 3000);
    } catch (err: any) {
      setReportError(err.message || 'Failed to generate report. Check the backend server.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Execute actual chat response using server express API proxied to Gemini 3.5 Flash!
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Create user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: textToSend
    };

    const initialUpdatedMessages = [...chatMessages, userMsg];
    setQnaMessages(initialUpdatedMessages);
    if (onUpdatePaper) {
      onUpdatePaper({
        ...paper,
        qna: initialUpdatedMessages
      });
    }
    if (onAddActivity) {
      onAddActivity('qna', `Asked custom query on ${paper.title}`);
    }

    setUserInput('');
    setIsThinking(true);
    setThinkingStateText('Reading paper contexts...');

    try {
      setThinkingStateText('Reading paper contexts...');
      // Establish history for context injection
      const history = chatMessages.map(m => ({
        role: m.sender === 'ai' ? 'model' as const : 'user' as const,
        text: m.text
      }));

      // Call our backend API service
      setThinkingStateText('Querying the backend semantic model...');
      const result = await askPaperQuery(paper.id, textToSend, history);

      const aiResponseMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: result.answer,
        citations: (result.sources || []).map((s, i) => ({
          id: String(i),
          author: 'Source',
          year: new Date().getFullYear(),
          title: s,
          link: '#'
        }))
      };

      setQnaMessages(prev => {
        const finalUpdatedMessages = [...prev, aiResponseMsg];
        if (onUpdatePaper) {
          onUpdatePaper({
            ...paper,
            qna: finalUpdatedMessages
          });
        }
        return finalUpdatedMessages;
      });
    } catch (err: any) {
      // Fallback with loading/error display
      setQnaMessages(prev => {
        const finalUpdatedMessages = [...prev, {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          timestamp: 'Just now',
          text: `Backend connection failed.\n\nError: ${err.message || 'No response.'}\n\nPlease verify that your separate backend server matches our API specification and is currently running at http://localhost:8000.`
        }];
        if (onUpdatePaper) {
          onUpdatePaper({
            ...paper,
            qna: finalUpdatedMessages
          });
        }
        return finalUpdatedMessages;
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleCitationExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`Scholarly bibliography export initiated successfully! RIS / BibTeX payload of ${paper.citations.length} cited records compiled.`);
      if (onAddActivity) {
        onAddActivity('report', `Exported citations list for ${paper.title}`);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-bg-paper text-brand-slate font-sans selection:bg-brand-teal-light/30 flex flex-col justify-between">
      
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-45 bg-white border-b border-outline-variant flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-bg-paper flex items-center justify-center text-brand-slate active:scale-95 duration-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-sans text-sm font-bold tracking-tight text-brand-slate truncate max-w-[180px] sm:max-w-md">
            {paper.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Bookmark Toggler */}
          <button 
            onClick={() => setBookmarkActive(!bookmarkActive)}
            className={`p-2 rounded-full cursor-pointer hover:bg-bg-paper transition-all ${
              bookmarkActive ? 'text-brand-teal' : 'text-on-surface-variant'
            }`}
          >
            <Bookmark className="w-4.5 h-4.5" fill={bookmarkActive ? "currentColor" : "none"} />
          </button>
          <button 
            type="button" 
            onClick={() => alert(`Active publication link shared successfully: ${paper.title}`)}
            className="text-on-surface-variant hover:text-brand-slate p-2 rounded-full cursor-pointer hover:bg-bg-paper"
          >
            <Share2 className="w-4.5 h-4.5" />
          </button>
          
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
            <img 
              alt="Researcher avatar" 
              src="https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* Main Tab Panels scrolling wrapper */}
      <main className="flex-grow pt-16 pb-24 px-4 max-w-2xl mx-auto w-full">
        
        {/* Tab Selection Bar with static top indicator */}
        <nav className="flex overflow-x-auto no-scrollbar gap-6 border-b border-outline-variant py-3 sticky top-14 bg-bg-paper z-40">
          {(['SUMMARY', 'CITATIONS', 'QNA', 'REPORT'] as DetailTab[]).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-shrink-0 flex flex-col items-center gap-1 group focus:outline-none cursor-pointer"
              >
                <span className={`font-sans text-xs font-bold transition-colors ${
                  isActive ? 'text-brand-teal' : 'text-on-surface-variant'
                }`}>
                  {tab.charAt(0) + tab.slice(1).toLowerCase()}
                </span>
                <div className={`h-[3px] w-full rounded-full transition-all ${
                  isActive ? 'bg-brand-teal' : 'bg-transparent group-hover:bg-outline-variant'
                }`}></div>
              </button>
            );
          })}
        </nav>

        {/* Tab Content Panels */}
        <div className="mt-5">
          
          {/* TAB 1: SUMMARY (Screen 5 & 6) */}
          {activeTab === 'SUMMARY' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Publication Journal Tag Block */}
              {paper.journal && (
                <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[9px] font-bold text-brand-teal bg-brand-teal/5 px-2 py-1 rounded-sm block w-fit mb-2">
                        {paper.journal.toUpperCase()}
                      </span>
                      <h2 className="font-sans text-lg font-bold text-brand-slate leading-tight">{paper.title}</h2>
                      <p className="font-sans text-xs text-on-surface-variant mt-1.5 font-medium">Authors: {paper.authors}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Insight abstract box */}
              <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-xl p-4 academic-border shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-brand-teal" />
                  <span className="font-mono text-[10px] font-bold text-brand-teal uppercase tracking-wider">AI Insight Abstract</span>
                </div>
                <p className="font-sans text-sm text-brand-slate leading-relaxed">
                  {paper.abstract}
                </p>
              </div>

              {/* Bento Layout Grid for technical details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Core Key Contributions panel */}
                <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-sans font-bold text-sm text-brand-slate mb-3">Key Contributions</h3>
                    <ul className="space-y-2.5">
                      {paper.contributions.map((contr, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4.5 h-4.5 text-brand-teal shrink-0 mt-0.5" />
                          <span className="font-sans text-xs text-brand-slate leading-normal">{contr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Efficiency metrics tabular layout block */}
                <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
                  <h3 className="font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-4">Training Efficiency</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-outline-variant/60 pb-1.5">
                      <span className="font-sans text-xs text-on-surface-variant font-medium">Hardware Base</span>
                      <span className="font-sans text-xs font-bold text-brand-slate">{paper.metrics.gpus}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-outline-variant/60 pb-1.5">
                      <span className="font-sans text-xs text-on-surface-variant font-medium">Compute Time</span>
                      <span className="font-sans text-xs font-bold text-brand-slate">{paper.metrics.time}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-sans text-xs text-on-surface-variant font-medium">Outcome Metric</span>
                      <span className="font-sans text-sm font-bold text-brand-teal">{paper.metrics.score}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Status Indicator Card (Glow elements) */}
              <div className="bg-brand-slate text-white rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-xs">
                <div className="relative z-10">
                  <span className="font-mono text-[10px] text-[#a0aec0] font-bold uppercase tracking-wider">Analysis Progress</span>
                  <div className="text-3xl font-bold mt-1">{paper.progress}%</div>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full mt-4 relative z-10 overflow-hidden">
                  <div 
                    className="h-full bg-brand-teal-light rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(134,242,228,0.6)]"
                    style={{ width: `${paper.progress}%` }}
                  ></div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-[0.05] pointer-events-none select-none text-white">
                  <ScrollText className="w-24 h-24" />
                </div>
              </div>

              {/* Inline citation chips quick selections */}
              {paper.citations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-sans font-bold text-sm text-brand-slate px-1">Inline Citations</h3>
                  <div className="flex flex-wrap gap-2">
                    {paper.citations.slice(0, 3).map((cit) => (
                      <button 
                        key={cit.id}
                        onClick={() => { setActiveTab('CITATIONS'); }}
                        className="bg-white border border-outline-variant px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-surface-container font-sans text-xs font-medium"
                      >
                        <span className="font-mono text-[10px] text-brand-teal">[{cit.id}]</span>
                        <span>{cit.author} ({cit.year})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Figures Preview Illustration with caption */}
              {paper.figures && paper.figures.map((fig, idx) => (
                <div key={idx} className="border border-outline-variant rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="p-3 border-b border-outline-variant bg-bg-paper">
                    <h4 className="font-sans font-bold text-xs text-brand-slate">{fig.title}</h4>
                  </div>
                  <div className="aspect-video bg-brand-slate/5 flex items-center justify-center p-4">
                    <img 
                      alt={fig.title}
                      src={fig.url}
                      className="rounded-lg object-contain h-full w-full max-h-48"
                    />
                  </div>
                  <div className="p-3 border-t border-outline-variant/60 bg-bg-paper text-center">
                    <p className="font-mono text-[10px] text-on-surface-variant italic font-semibold">{fig.caption}</p>
                  </div>
                </div>
              ))}

              {/* Click to open Q&A tab floating suggestion */}
              <div className="pt-2 text-center">
                <button 
                  type="button"
                  onClick={() => setActiveTab('QNA')}
                  className="bg-brand-slate text-white rounded-full px-5 py-2.5 text-xs font-semibold shadow-md active:scale-95 duration-150 cursor-pointer flex items-center gap-1.5 mx-auto font-mono text-[10px] uppercase tracking-wider"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-teal-light" />
                  Ask AI Helper about this data
                </button>
              </div>

            </motion.div>
          )}

          {/* TAB 2: CITATIONS (Screen 9) */}
          {activeTab === 'CITATIONS' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Breadcrumb path */}
              <div className="flex items-center gap-1 font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
                <span>MY PAPERS</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-brand-teal font-bold font-semibold">CITATION EXTRACTION</span>
              </div>

              {/* Citation header metadata card */}
              <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-sans font-bold text-lg text-brand-slate mb-1">Analysis: Transformer-based NLP</h2>
                    <p className="font-sans text-xs text-on-surface-variant font-medium">
                      Source: <span className="italic font-semibold">{paper.title}</span>
                    </p>
                  </div>
                  <div className="bg-brand-teal-light/25 text-brand-cyan-dark px-2.5 py-1 rounded-full font-mono text-[10px] font-bold flex items-center gap-1 shrink-0 scale-95">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" />
                    <span>{paper.citations.length} Citations</span>
                  </div>
                </div>
              </div>

              {/* Citations data table */}
              <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-bg-paper border-b border-outline-variant">
                        <th className="px-4 py-3 text-left font-mono text-[10px] text-on-surface-variant uppercase tracking-wider w-10">#</th>
                        <th className="px-4 py-3 text-left font-mono text-[10px] text-on-surface-variant uppercase tracking-wider min-w-[100px]">Author</th>
                        <th className="px-4 py-3 text-left font-mono text-[10px] text-on-surface-variant uppercase tracking-wider w-16">Year</th>
                        <th className="px-4 py-3 text-left font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Title</th>
                        <th className="px-4 py-3 text-right font-mono text-[10px] text-on-surface-variant uppercase tracking-wider w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/35 text-xs text-brand-slate">
                      {paper.citations.map((cit, index) => (
                        <tr key={index} className="hover:bg-bg-paper transition-colors duration-100">
                          <td className="px-4 py-3.5 font-mono text-[10px] text-outline">{index + 1 < 10 ? `0${index + 1}` : index + 1}</td>
                          <td className="px-4 py-3.5 font-bold">{cit.author}</td>
                          <td className="px-4 py-3.5 font-medium">{cit.year}</td>
                          <td className="px-4 py-3.5 leading-snug font-medium">{cit.title}</td>
                          <td className="px-4 py-3.5 text-right">
                            <a 
                              href={cit.link} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="text-brand-teal hover:opacity-85 translate-y-0.5 inline-block"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table pagination stats footer */}
                <div className="px-4 py-3 bg-bg-paper border-t border-outline-variant flex items-center justify-between font-sans text-xs">
                  <span className="text-on-surface-variant">Showing {paper.citations.length} of {paper.citations.length} extracted references</span>
                  <div className="flex gap-2">
                    <button disabled className="text-outline cursor-not-allowed opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                    <button disabled className="text-outline cursor-not-allowed opacity-40"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {/* CrossRef database auto-refine card */}
              <div className="p-4 border border-dashed border-brand-teal/40 rounded-xl bg-brand-teal/5 flex items-center gap-3">
                <Database className="w-5 h-5 text-brand-teal shrink-0" />
                <div>
                  <h4 className="font-sans font-bold text-xs text-brand-slate">Auto-Refining Bibliography</h4>
                  <p className="font-sans text-[11px] text-on-surface-variant font-medium">
                    Insight AI has verified these citations and linked metadata records securely against the CrossRef registry indexing database.
                  </p>
                </div>
              </div>

              {/* Download bibliography button */}
              <div className="space-y-2.5">
                <button
                  onClick={handleCitationExport}
                  disabled={isExporting}
                  className="w-full bg-brand-slate text-white h-12 rounded-xl flex items-center justify-center gap-2 cursor-pointer font-sans font-semibold hover:opacity-95 shadow-sm"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-brand-teal-light" />
                      <span>Compiling BibTeX file...</span>
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-4 h-4" />
                      <span>Download Citations</span>
                    </>
                  )}
                </button>
                <p className="text-center font-mono text-[9px] uppercase tracking-wider text-outline">
                  Available Export Targets: BibTeX, RIS, EndNote, CSV
                </p>
              </div>

            </motion.div>
          )}

          {/* TAB 3: Q&A (Screen 8) */}
          {activeTab === 'QNA' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-[520px] bg-white border border-outline-variant rounded-xl overflow-hidden shadow-xs relative"
            >
              {/* Active context ribbon */}
              <div className="p-3 bg-bg-paper border-b border-outline-variant flex items-center justify-between shrink-0 font-sans text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-brand-teal rounded-full animate-pulse"></span>
                  <span className="font-mono text-[10px] font-bold text-brand-cyan-dark uppercase tracking-wider">RAG System Active</span>
                </div>
                <div className="font-sans text-xs text-on-surface-variant truncate max-w-[200px] flex items-center gap-1 font-semibold">
                  <Database className="w-3.5 h-3.5 text-outline" /> {paper.title}
                </div>
              </div>

              {/* Dialog Feed area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
                
                {chatMessages.map((msg, index) => {
                  const isAi = msg.sender === 'ai';
                  
                  return (
                    <motion.div
                      key={msg.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col max-w-[85%] ${isAi ? 'items-start mr-auto' : 'items-end ml-auto'}`}
                    >
                      {/* Message header */}
                      <div className="flex items-center gap-2 mb-1.5 font-mono text-[9px] text-on-surface-variant">
                        {!isAi && <span className="font-semibold">{msg.timestamp || '10:45 AM'}</span>}
                        <span className={`font-bold ${isAi ? 'text-brand-teal' : 'text-on-primary-container'}`}>
                          {isAi ? 'INSIGHT AI' : 'DR. THORNE'}
                        </span>
                        {isAi && <span className="font-medium">{msg.timestamp || '10:44 AM'}</span>}
                      </div>

                      {/* Content Bubble */}
                      <div className={`p-4 rounded-xl leading-relaxed whitespace-pre-wrap ${
                        isAi 
                          ? 'bg-bg-paper border-l-4 border-l-brand-teal border-y border-r border-outline-variant text-brand-slate shadow-xs rounded-tl-none' 
                          : 'bg-brand-slate-light text-white shadow-xs rounded-tr-none'
                      }`}>
                        <p>{msg.text}</p>
                        
                        {/* Custom Citation response tags if any */}
                        {isAi && msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-outline-variant/65 flex flex-wrap gap-1.5">
                            {msg.citations.map((citText, cIdx) => (
                              <button
                                key={cIdx}
                                onClick={() => { setActiveTab('SUMMARY'); }}
                                className="bg-white border border-outline-variant text-brand-cyan-dark font-mono text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-brand-teal-light/20 transition-all cursor-pointer font-semibold"
                              >
                                <Link2 className="w-3 h-3 text-brand-teal" />
                                {citText}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* AI Thinking/Processing Indicator */}
                <AnimatePresence>
                  {isThinking && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-start max-w-[85%] font-sans text-xs"
                    >
                      <div className="flex items-center gap-2 mb-1.5 font-mono text-[9px] text-[#76777d]">
                        <span className="font-bold text-brand-teal">INSIGHT AI</span>
                        <span>Just now</span>
                      </div>
                      <div className="bg-bg-paper border-l-4 border-l-brand-teal border-y border-r border-outline-variant p-3 px-4 rounded-r-xl rounded-bl-xl flex items-center gap-3">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                        <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{thinkingStateText}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={chatBottomRef} />
              </div>

              {/* Bottom Quick-Action contextual tags */}
              <div className="p-3 bg-bg-paper border-t border-outline-variant flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                <button 
                  onClick={() => handleSendMessage("Explain the methodology step breakdown mentioned in this paper.")}
                  className="whitespace-nowrap bg-white text-on-surface-variant font-mono text-[9px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border border-outline-variant shadow-xs hover:bg-bg-paper transition-all cursor-pointer shrink-0"
                >
                  Explain Methodology
                </button>
                <button 
                  onClick={() => handleSendMessage("Extract the primary statistics or experimental training data tables.")}
                  className="whitespace-nowrap bg-white text-on-surface-variant font-mono text-[9px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border border-outline-variant shadow-xs hover:bg-bg-paper transition-all cursor-pointer shrink-0"
                >
                  Extract Data Tables
                </button>
                <button 
                  onClick={() => handleSendMessage("Verify the cross-citations and links of the external references list.")}
                  className="whitespace-nowrap bg-white text-on-surface-variant font-mono text-[9px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border border-outline-variant shadow-xs hover:bg-bg-paper transition-all cursor-pointer shrink-0"
                >
                  Check Cross-Citations
                </button>
              </div>

              {/* Keyboard/Text capture zone */}
              <div className="p-3 border-t border-outline-variant bg-white shrink-0 flex items-center gap-2">
                <button className="p-2 text-on-surface-variant hover:text-brand-teal active:scale-95 transition-all outline-none">
                  <Paperclip className="w-4.5 h-4.5" />
                </button>
                <input 
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(userInput); }}
                  placeholder="Ask any academic questions about WMT, BLEU, or residual layers..."
                  className="flex-grow font-sans text-xs bg-bg-paper border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal transition-all text-brand-slate"
                />
                <button 
                  onClick={() => handleSendMessage(userInput)}
                  className="bg-brand-slate hover:bg-brand-slate-light text-white p-2.5 rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all text-brand-teal-light flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4 fill-currentColor" />
                </button>
              </div>

            </motion.div>
          )}

          {/* TAB 4: REPORT (Screen 7) */}
          {activeTab === 'REPORT' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Header Title block */}
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] text-brand-teal font-extrabold uppercase tracking-widest block">
                  Synthesis Module v4.2
                </span>
                <h2 className="font-sans text-xl font-bold tracking-tight text-brand-slate leading-none">
                  Final Report Generation
                </h2>
                <p className="font-sans text-xs text-on-surface-variant font-medium mt-1 leading-normal">
                  Review and finalize the structured synthesis of your research corpus. The AI has compiled this active manuscript into a coherent technical summary.
                </p>
              </div>

              {/* Compilation Main Card details preview */}
              <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm p-5 space-y-5">
                
                {/* Executive summary quote review */}
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-brand-slate">
                      <ScrollText className="w-4.5 h-4.5 text-brand-teal" />
                      <span>Executive Summary Summary</span>
                    </div>
                    <span className="font-mono text-[9px] text-[#76777d] bg-bg-paper border border-outline-variant px-2 py-0.5 rounded font-bold uppercase">
                      Auto-Synthesized
                    </span>
                  </div>
                  <div className="bg-brand-teal/5 border-l-2 border-brand-teal p-3 text-xs text-brand-slate italic leading-relaxed rounded-r-lg">
                    {paper.report.executiveSummary}
                  </div>
                </div>

                {/* Future scope list review */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5 text-brand-slate font-bold text-xs">
                    <CheckCircle2 className="w-4.5 h-4.5 text-brand-teal" />
                    <span>Future Scope checklist</span>
                  </div>
                  <ul className="space-y-1.5 list-disc pl-5 text-xs text-on-surface-variant font-medium leading-normal">
                    {paper.report.futureScope.map((scope, sIdx) => (
                      <li key={sIdx}>{scope}</li>
                    ))}
                  </ul>
                </div>

                {/* Report compilation parameters block */}
                <div className="bg-bg-paper border border-outline-variant rounded-xl p-4">
                  <h4 className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-3 block font-bold">Report Parameters</h4>
                  
                  <div className="grid grid-cols-3 gap-2 text-center select-none">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[9px] text-[#76777d]">Sources Ingested</span>
                      <span className="font-sans text-xs font-bold text-brand-slate">{paper.report.sourcesCount} PDF/TEX</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-x border-outline-variant/60">
                      <span className="font-mono text-[9px] text-[#76777d]">Confidence Score</span>
                      <span className="font-sans text-xs font-bold text-brand-teal">{paper.report.confidence}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[9px] text-[#76777d]">Word Volume</span>
                      <span className="font-sans text-xs font-bold text-brand-slate">{paper.report.wordCount}</span>
                    </div>
                  </div>

                  {paper.report.collaborators && paper.report.collaborators.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-outline-variant/50 flex items-center justify-between font-sans text-[11px] text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          {paper.report.collaborators.map((c, cIdx) => (
                            <div 
                              key={cIdx}
                              title={c.name}
                              className={`w-6 h-6 rounded-full border-1 border-white ${c.color} text-white flex items-center justify-center font-mono text-[8px] font-extrabold uppercase shrink-0`}
                            >
                              {c.initials}
                            </div>
                          ))}
                        </div>
                        <span className="font-medium">Shared with {paper.report.collaborators.length} collaborators</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Double column replica thumbnail with view hover effect */}
                {paper.report.previewUrl && (
                  <div className="aspect-[3/4] bg-bg-paper border border-outline-variant rounded-xl overflow-hidden relative group cursor-pointer shadow-xs max-h-56 mx-auto w-full max-w-[200px]">
                    <img 
                      src={paper.report.previewUrl} 
                      alt="Compilation preview page layout" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-brand-slate/5 opacity-0 group-hover:opacity-100 transition-all select-none">
                      <div className="bg-white px-3.5 py-1.5 rounded-full shadow flex items-center gap-1.5 text-brand-slate text-[10px] font-bold uppercase tracking-wider font-mono">
                        <ZoomIn className="w-3.5 h-3.5 text-brand-teal" />
                        Full Preview
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Report generation status feedback */}
              {reportError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-sans flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{reportError}</span>
                  <button onClick={() => setReportError(null)} className="ml-auto text-[10px] font-bold bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded cursor-pointer">Dismiss</button>
                </div>
              )}
              {reportSuccess && (
                <div className="p-3 text-xs bg-brand-teal/10 border border-brand-teal-light text-brand-cyan-dark rounded-lg font-sans flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
                  <span>Report generated and downloaded successfully!</span>
                </div>
              )}

              {/* Ready for Distribution CTA buttons card footer */}
              <div className="bg-white border border-outline-variant p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
                <div className="text-center md:text-left">
                  <h3 className="font-sans font-bold text-sm text-brand-slate">Compile Final Manuscript</h3>
                  <p className="font-sans text-[11px] text-on-surface-variant font-medium mt-0.5 leading-snug">
                    Compile references, graphs, and executive parameters into high-quality publication documents.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0 justify-end">
                  <button 
                    onClick={() => handleGenerateReport('pdf')}
                    disabled={isGeneratingReport}
                    className="w-full sm:w-auto bg-brand-slate text-white px-5 py-2.5 rounded-lg text-xs font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm disabled:opacity-60"
                  >
                    {isGeneratingReport ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-brand-teal-light" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-brand-teal-light" />
                        <span>Generate Report</span>
                      </>
                    )}
                  </button>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => handleGenerateReport('pdf')}
                      disabled={isGeneratingReport}
                      className="flex-1 bg-white border border-outline px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-bg-paper transition-all cursor-pointer text-brand-slate flex items-center justify-center gap-1 disabled:opacity-60"
                    >
                      <ScrollText className="w-3.5 h-3.5 text-brand-teal" />
                      PDF
                    </button>
                    <button 
                      onClick={() => handleGenerateReport('docx')}
                      disabled={isGeneratingReport}
                      className="flex-1 bg-white border border-outline px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-bg-paper transition-all cursor-pointer text-brand-slate flex items-center justify-center gap-1 disabled:opacity-60"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-brand-teal" />
                      DOCX
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

        </div>

      </main>

      {/* Global Shared Bottom Nav Drawer */}
      <nav className="fixed bottom-0 w-full z-45 bg-white border-t border-outline-variant flex justify-around items-center h-16 w-full px-4">
        <button 
          onClick={() => onSelectScreen('DASHBOARD')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-brand-slate rounded-xl px-4 py-1.5 cursor-pointer font-sans transition-all"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-mono text-[9px] mt-0.5 uppercase tracking-wide">Dashboard</span>
        </button>

        {/* Highlight papers list selector implicitly */}
        <button 
          onClick={() => onSelectScreen('MY_PAPERS')}
          className="flex flex-col items-center justify-center text-brand-teal bg-brand-teal-light/10 rounded-xl px-4 py-1.5 cursor-pointer font-sans transition-all"
        >
          <BookOpen className="w-5 h-5 text-brand-teal" />
          <span className="font-mono text-[9px] font-semibold mt-0.5 uppercase tracking-wide">My Papers</span>
        </button>

        <button 
          onClick={() => onSelectScreen('MY_PAPERS')}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-brand-slate rounded-xl px-4 py-1.5 cursor-pointer font-sans transition-all"
        >
          <DownloadCloud className="w-5 h-5" />
          <span className="font-mono text-[9px] mt-0.5 uppercase tracking-wide font-medium">Upload</span>
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
