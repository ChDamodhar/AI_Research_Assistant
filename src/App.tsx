/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DEFAULT_USER } from './data';
import { Paper, UserProfileType, Activity } from './types';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import DashboardView from './components/DashboardView';
import MyPapersView from './components/MyPapersView';
import PaperDetailsView from './components/PaperDetailsView';
import UserProfileView from './components/UserProfileView';
import AdminConsoleView from './components/AdminConsoleView';
import { getPapers, getReports, setToken, getToken } from './api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken());
  const [activeScreen, setActiveScreen] = useState<'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'MY_PAPERS' | 'PAPER_DETAILS' | 'USER_PROFILE' | 'ADMIN_DASHBOARD'>(
    getToken() ? 'DASHBOARD' : 'LOGIN'
  );

  // Track registered users locally for admin panel management  
  const [registeredUsers, setRegisteredUsers] = useState<{ [email: string]: { fullName: string; role: string; inactive?: boolean } }>(() => {
    try {
      const saved = localStorage.getItem('insightai_registered_users');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return {};
  });

  const [user, setUser] = useState<UserProfileType>(() => {
    try {
      const saved = localStorage.getItem('insightai_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_USER;
  });
  const [papers, setPapers] = useState<Paper[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [showDirectUpload, setShowDirectUpload] = useState(false);
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);

  // Refresh papers from the backend whenever we become authenticated
  const refreshPapersFromBackend = async () => {
    if (!getToken()) return;
    setIsLoadingPapers(true);
    try {
      const { papers: backendPapers } = await getPapers();
      setPapers(backendPapers);

      // Build activities from reports list
      try {
        const reportsData = await getReports();
        const reportActivities: Activity[] = reportsData.reports.map(r => ({
          id: `report-${r.id}`,
          title: `Generated ${r.format.toUpperCase()} Report for paper ${r.paper_id.slice(0, 8)}...`,
          type: 'report' as const,
          timestamp: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          paperId: r.paper_id
        }));
        const uploadActivities: Activity[] = backendPapers.slice(0, 5).map(p => ({
          id: `upload-${p.id}`,
          title: `Uploaded paper: ${p.title}`,
          type: 'upload' as const,
          timestamp: p.uploadedAt,
          paperId: p.id
        }));
        setActivities([...reportActivities, ...uploadActivities]);
      } catch (e) {
        console.warn('Could not load reports for activity feed', e);
      }
    } catch (err) {
      console.warn('Could not load papers from backend, likely not running.', err);
    } finally {
      setIsLoadingPapers(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshPapersFromBackend();
    }
  }, [isAuthenticated]);

  // ── Auth Handlers ────────────────────────────────────────────────────────────

  const handleLoginSuccess = (email: string, profile: UserProfileType) => {
    setUser(profile);
    localStorage.setItem('insightai_user_profile', JSON.stringify(profile));

    // Track user in local admin registry
    const cleanEmail = email.trim().toLowerCase();
    const updatedUsers = {
      ...registeredUsers,
      [cleanEmail]: { fullName: profile.fullName, role: profile.role }
    };
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('insightai_registered_users', JSON.stringify(updatedUsers));

    setIsAuthenticated(true);
    setActiveScreen('DASHBOARD');
  };

  const handleRegisterSuccess = (email: string, profile: UserProfileType) => {
    handleLoginSuccess(email, profile);
  };

  // ── Paper Handlers ────────────────────────────────────────────────────────────

  const handleUpdatePaper = (updatedPaper: Paper) => {
    setPapers(prev => prev.map(p => p.id === updatedPaper.id ? updatedPaper : p));
  };

  const handleAddCustomPaper = (newPaper: Paper) => {
    setPapers(prev => [newPaper, ...prev]);
    handleAddActivity('upload', `Uploaded paper: ${newPaper.title}`, newPaper.id);
    // Refresh backend papers list to stay in sync
    setTimeout(refreshPapersFromBackend, 2000);
  };

  const handleDeletePaper = (id: string) => {
    setPapers(prev => prev.filter(p => p.id !== id));
    handleAddActivity('analysis', 'Archived paper from dynamic reference repository');
  };

  const handleAddActivity = (type: 'upload' | 'analysis' | 'report' | 'qna', title: string, paperId?: string) => {
    const newAct: Activity = {
      id: 'act-' + Date.now() + Math.random().toString(36).substring(2, 5),
      title,
      type,
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      paperId: paperId || selectedPaperId || undefined
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // ── Admin Handlers ────────────────────────────────────────────────────────────

  const handleToggleUserStatus = (targetEmail: string) => {
    const cleanTarget = targetEmail.trim().toLowerCase();
    if (cleanTarget === user.email.trim().toLowerCase()) {
      alert('Precaution triggered: You cannot deactivate your active administrator session.');
      return;
    }
    const updated = {
      ...registeredUsers,
      [cleanTarget]: {
        ...registeredUsers[cleanTarget],
        inactive: !registeredUsers[cleanTarget]?.inactive
      }
    };
    setRegisteredUsers(updated);
    localStorage.setItem('insightai_registered_users', JSON.stringify(updated));
  };

  const handleDeleteUser = (targetEmail: string) => {
    const cleanTarget = targetEmail.trim().toLowerCase();
    if (cleanTarget === user.email.trim().toLowerCase()) {
      alert('Precaution triggered: You cannot delete your own active administrator session.');
      return;
    }
    const updated = { ...registeredUsers };
    delete updated[cleanTarget];
    setRegisteredUsers(updated);
    localStorage.setItem('insightai_registered_users', JSON.stringify(updated));
  };

  // ── Unauthenticated Flow ──────────────────────────────────────────────────────

  if (!isAuthenticated) {
    if (activeScreen === 'REGISTER') {
      return (
        <RegisterView
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={() => setActiveScreen('LOGIN')}
        />
      );
    }
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setActiveScreen('REGISTER')}
      />
    );
  }

  // ── Authenticated Router ──────────────────────────────────────────────────────

  switch (activeScreen) {
    case 'DASHBOARD':
      return (
        <DashboardView
          user={user}
          papers={papers}
          activities={activities}
          onSelectScreen={(screen) => {
            setActiveScreen(screen);
            setShowDirectUpload(false);
          }}
          onSelectPaper={(id) => {
            setSelectedPaperId(id);
            setActiveScreen('PAPER_DETAILS');
          }}
          onUploadClicked={() => {
            setShowDirectUpload(true);
            setActiveScreen('MY_PAPERS');
          }}
        />
      );
    case 'MY_PAPERS':
      return (
        <MyPapersView
          papers={papers}
          onSelectScreen={(screen) => {
            setActiveScreen(screen);
            setShowDirectUpload(false);
          }}
          onSelectPaper={(id) => {
            setSelectedPaperId(id);
            setActiveScreen('PAPER_DETAILS');
          }}
          onAddCustomPaper={handleAddCustomPaper}
          onDeletePaper={handleDeletePaper}
          showDirectUpload={showDirectUpload}
          onCloseDirectUpload={() => setShowDirectUpload(false)}
        />
      );
    case 'PAPER_DETAILS':
      const activePaper = papers.find(p => p.id === selectedPaperId) || papers[0];
      return activePaper ? (
        <PaperDetailsView
          paper={activePaper}
          onUpdatePaper={handleUpdatePaper}
          onAddActivity={handleAddActivity}
          onBack={() => setActiveScreen('MY_PAPERS')}
          onSelectScreen={(screen) => {
            setActiveScreen(screen);
            setShowDirectUpload(false);
          }}
        />
      ) : (
        <div className="min-h-screen bg-bg-paper p-8 flex items-center justify-center font-sans">
          <p className="text-on-surface-variant font-medium">Select a paper to view details.</p>
        </div>
      );
    case 'USER_PROFILE':
      return (
        <UserProfileView
          user={user}
          onUpdateUser={(updated) => {
            setUser(updated);
            localStorage.setItem('insightai_user_profile', JSON.stringify(updated));
          }}
          onLogout={() => {
            setToken('');
            localStorage.removeItem('insightai_user_profile');
            setIsAuthenticated(false);
            setPapers([]);
            setActivities([]);
            setActiveScreen('LOGIN');
          }}
          onSelectScreen={(screen) => {
            setActiveScreen(screen);
            setShowDirectUpload(false);
          }}
        />
      );
    case 'ADMIN_DASHBOARD':
      return (
        <AdminConsoleView
          onBack={() => setActiveScreen('DASHBOARD')}
          onSelectScreen={(screen) => {
            setActiveScreen(screen);
            setShowDirectUpload(false);
          }}
          registeredUsers={registeredUsers}
          onToggleUserStatus={handleToggleUserStatus}
          onDeleteUser={handleDeleteUser}
          totalPapersCount={papers.length}
          totalReportsCount={activities.filter(a => a.type === 'report').length}
        />
      );
    default:
      return (
        <div className="min-h-screen bg-bg-paper p-8 flex items-center justify-center font-sans">
          <p className="text-on-surface-variant font-medium">Gateway session calibration in progress...</p>
        </div>
      );
  }
}
