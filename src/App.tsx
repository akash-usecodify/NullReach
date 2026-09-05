/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Upload, 
  Sparkles, 
  Coins, 
  X, 
  CheckCircle2, 
  ArrowUpDown, 
  FileSpreadsheet, 
  Layers, 
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Download,
  Lock,
  Shield,
  Globe,
  SlidersHorizontal,
  Settings,
  ShieldCheck,
  Building2,
  Users,
  LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lead, FilterState, UploadBatch } from './types';
import { INITIAL_LEADS, getSampleCsvString } from './data/sampleLeads';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LiquidBackground } from './components/LiquidBackground';
import { LeadCard } from './components/LeadCard';
import { LeadDetailModal } from './components/LeadDetailModal';
import { UploadModal } from './components/UploadModal';
import { TopUpModal } from './components/TopUpModal';
import { AuthModal } from './components/AuthModal';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { LandingPage } from './components/LandingPage';

const LEADS_STORAGE_KEY = 'nullreach_custom_leads_v2';
const LEGACY_LEADS_STORAGE_KEY = 'leadflow_custom_leads_v1';
const SHEET_NAME_KEY = 'nullreach_sheet_name_v2';
const UPLOAD_BATCHES_STORAGE_KEY = 'nullreach_upload_batches_v1';

const DEFAULT_UPLOAD_BATCHES: UploadBatch[] = [
  {
    id: 'batch-initial-sample',
    sheetName: 'Verified Global Executive Directory',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    leadCount: INITIAL_LEADS.length,
    uploadedByUserId: 'user-admin-1',
    uploadedByUserName: 'Akash Suresh',
    mode: 'append',
    fileType: 'csv'
  }
];

function MainPortal() {
  const { 
    currentUser, 
    isAuthenticated, 
    isAdmin, 
    isLeadUnlocked, 
    unlockLead,
    isLeadBookmarked,
    toggleBookmarkLead,
    recordLeadView,
    allUsers,
    switchUser,
    adminSettings,
    logout
  } = useAuth();

  // Leads dataset state
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem(LEADS_STORAGE_KEY) || localStorage.getItem(LEGACY_LEADS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_LEADS;
  });

  // Persistent upload batches history
  const [uploadBatches, setUploadBatches] = useState<UploadBatch[]>(() => {
    try {
      const saved = localStorage.getItem(UPLOAD_BATCHES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_UPLOAD_BATCHES;
  });

  const [sheetName, setSheetName] = useState<string>(() => {
    try {
      return localStorage.getItem(SHEET_NAME_KEY) || 'Executive Lead Database';
    } catch {
      return 'Executive Lead Database';
    }
  });

  // Filter and search state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'All',
    country: 'All',
    location: '',
    status: 'all',
    sortBy: 'recent',
  });

  // Modals state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpInitialCredits, setTopUpInitialCredits] = useState<number>(10);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  // View mode: 'portal' or 'landing'
  const [viewMode, setViewMode] = useState<'portal' | 'landing'>('portal');
  // Gatekeeper: only show portal when user is logged in
  const isViewingLanding = !currentUser || viewMode === 'landing';

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Secure trigger for uploading lead sheets (Admin privilege)
  const handleTriggerUpload = () => {
    if (!isAuthenticated) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      showToast('Admin sign-in required to manage lead sheets', 'info');
      return;
    }
    if (!isAdmin) {
      showToast('Administrator privileges required to upload lead sheets', 'error');
      setIsUploadModalOpen(true);
      return;
    }
    setIsUploadModalOpen(true);
  };

  // Trigger admin panel
  const handleOpenAdminPanel = () => {
    if (!isAuthenticated) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      showToast('Please sign in with administrator credentials', 'info');
      return;
    }
    if (!isAdmin) {
      showToast('Administrator privileges required to access Admin Panel', 'error');
      return;
    }
    setIsAdminPanelOpen(true);
  };

  // Handle claiming lead when viewed or unlocked under exclusive visibility
  const handleClaimLead = (leadId: string) => {
    if (!currentUser || !adminSettings.exclusiveLeadViewing) return;
    setLeads(prev => prev.map(l => {
      if (l.id === leadId && !l.claimedByUserId) {
        return {
          ...l,
          claimedByUserId: currentUser.id,
          claimedByUserName: currentUser.name,
          claimedAt: new Date().toISOString()
        };
      }
      return l;
    }));
  };

  // Admin release claim on a lead
  const handleReleaseClaim = (leadId: string) => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          claimedByUserId: undefined,
          claimedByUserName: undefined,
          claimedAt: undefined,
        };
      }
      return l;
    }));
    showToast('Lead released back to public directory', 'info');
  };

  // Admin release all claims
  const handleReleaseAllClaims = () => {
    setLeads(prev => prev.map(l => ({
      ...l,
      claimedByUserId: undefined,
      claimedByUserName: undefined,
      claimedAt: undefined,
    })));
    showToast('All lead claims cleared from directory', 'info');
  };

  // ⌘ K keyboard shortcut listener to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const searchEl = document.getElementById('leads-search-input');
        if (searchEl) {
          searchEl.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync leads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    } catch {
      // ignore
    }
  }, [leads]);

  // Sync sheetName to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SHEET_NAME_KEY, sheetName);
    } catch {
      // ignore
    }
  }, [sheetName]);

  // Sync upload batches to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(UPLOAD_BATCHES_STORAGE_KEY, JSON.stringify(uploadBatches));
    } catch {
      // ignore
    }
  }, [uploadBatches]);

  // Extract unique categories dynamically from current dataset
  const categories = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.category && l.category.trim()) {
        set.add(l.category.trim());
      }
    });
    return ['All', ...Array.from(set).sort()];
  }, [leads]);

  // Extract unique countries dynamically from current dataset
  const countries = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.country && l.country.trim()) {
        set.add(l.country.trim());
      }
    });
    return ['All', ...Array.from(set).sort()];
  }, [leads]);

  // Filtered & Sorted leads
  const filteredLeads = useMemo(() => {
    const query = filters.searchQuery.toLowerCase().trim();

    return leads
      .filter((lead) => {
        // Exclusive Lead Viewing logic:
        // If a user views/claims a lead, the specific lead shouldn't be visible to other users at all!
        if (adminSettings.exclusiveLeadViewing && lead.claimedByUserId) {
          const isClaimedByMe = currentUser && lead.claimedByUserId === currentUser.id;
          const adminCanBypass = isAdmin && adminSettings.adminCanViewAllLeads;
          if (!isClaimedByMe && !adminCanBypass) {
            return false; // Hidden completely from other users!
          }
        }

        // Country filter
        if (filters.country && filters.country !== 'All' && lead.country !== filters.country) {
          return false;
        }

        // Category filter
        if (filters.category !== 'All' && lead.category !== filters.category) {
          return false;
        }

        // Status filter (all, unlocked, locked, bookmarked, viewed)
        const unlocked = isLeadUnlocked(lead.id);
        const bookmarked = isLeadBookmarked(lead.id);
        const viewed = (currentUser?.viewedLeadIds || []).includes(lead.id);

        if (filters.status === 'unlocked' && !unlocked) return false;
        if (filters.status === 'locked' && unlocked) return false;
        if (filters.status === 'bookmarked' && !bookmarked) return false;
        if (filters.status === 'viewed' && !viewed) return false;

        // Search text: checks name, company, title, location, category, country, notes
        if (query) {
          const matchName = lead.name.toLowerCase().includes(query);
          const matchCompany = lead.company.toLowerCase().includes(query);
          const matchTitle = lead.title.toLowerCase().includes(query);
          const matchLocation = lead.location.toLowerCase().includes(query);
          const matchCategory = lead.category.toLowerCase().includes(query);
          const matchCountry = lead.country?.toLowerCase().includes(query);
          const matchNotes = lead.notes?.toLowerCase().includes(query);
          if (!matchName && !matchCompany && !matchTitle && !matchLocation && !matchCategory && !matchCountry && !matchNotes) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (filters.sortBy === 'company') {
          return a.company.localeCompare(b.company);
        }
        if (filters.sortBy === 'category') {
          return a.category.localeCompare(b.category);
        }
        return 0;
      });
  }, [leads, filters, isLeadUnlocked, isLeadBookmarked, currentUser, isAdmin, adminSettings]);

  // Handle opening lead details
  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
    if (currentUser && adminSettings.exclusiveLeadViewing) {
      handleClaimLead(lead.id);
    }
  };

  // Quick unlock directly from the card
  const handleQuickUnlock = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      setAuthMode('register');
      setIsAuthModalOpen(true);
      showToast(`Please sign in or register to unlock contacts (${adminSettings.registrationBonusCredits} Free Credits)`, 'info');
      return;
    }

    if (isLeadUnlocked(lead.id)) {
      handleOpenLead(lead);
      return;
    }

    const cost = adminSettings.costPerUnlock;
    if (!currentUser || (currentUser.credits < cost && cost > 0)) {
      setIsTopUpModalOpen(true);
      showToast('You are out of credits! Top up to reveal lead contact info.', 'error');
      return;
    }

    const res = unlockLead(lead.id);
    if (res.success) {
      showToast(res.message, 'success');
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#a855f7', '#3b82f6', '#10b981']
        });
      } catch {
        // ignore
      }
      handleOpenLead(lead);
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle CSV leads import
  const handleLeadsImported = (
    importedLeads: Lead[], 
    mode: 'replace' | 'append', 
    importedSheetName: string, 
    newBatch?: UploadBatch
  ) => {
    const batch: UploadBatch = newBatch || {
      id: `batch-${Date.now()}`,
      sheetName: importedSheetName,
      timestamp: new Date().toISOString(),
      leadCount: importedLeads.length,
      uploadedByUserId: currentUser?.id || 'admin',
      uploadedByUserName: currentUser?.name || 'Administrator',
      mode: mode,
      fileType: 'csv'
    };

    setUploadBatches(prev => [batch, ...prev.filter(b => b.id !== batch.id)]);

    if (mode === 'replace') {
      // In replace mode, preserve any existing claimed/unlocked records so user history is never destroyed!
      const claimedLeadsToKeep = leads.filter(l => !!l.claimedByUserId);
      const importedEmails = new Set(importedLeads.map(l => l.email.toLowerCase()));
      const safeClaimed = claimedLeadsToKeep.filter(l => !importedEmails.has(l.email.toLowerCase()));
      setLeads([...importedLeads, ...safeClaimed]);
    } else {
      // Merge preventing duplicates by email, preserving past records
      const existingEmails = new Set(leads.map(l => l.email.toLowerCase()));
      const filteredNew = importedLeads.filter(l => !existingEmails.has(l.email.toLowerCase()));
      setLeads(prev => [...prev, ...filteredNew]);
    }
    setSheetName(importedSheetName);
    showToast(`Saved ${importedLeads.length} leads under "${importedSheetName}". Past records preserved!`, 'success');
  };

  const handleResetToDefault = () => {
    setLeads(INITIAL_LEADS);
    setSheetName('Executive Lead Database');
    setUploadBatches(DEFAULT_UPLOAD_BATCHES);
    showToast('Reset back to sample Google Sheet leads.', 'info');
  };

  const unlockedCount = useMemo(() => {
    if (!currentUser) return 0;
    return leads.filter(l => isLeadUnlocked(l.id)).length;
  }, [leads, currentUser, isLeadUnlocked]);

  const bookmarkedCount = useMemo(() => {
    if (!currentUser) return 0;
    return leads.filter(l => isLeadBookmarked(l.id)).length;
  }, [leads, currentUser, isLeadBookmarked]);

  const viewedCount = useMemo(() => {
    if (!currentUser) return 0;
    const viewedIds = currentUser.viewedLeadIds || [];
    return leads.filter(l => viewedIds.includes(l.id)).length;
  }, [leads, currentUser]);

  const claimedCount = useMemo(() => {
    return leads.filter(l => !!l.claimedByUserId).length;
  }, [leads]);

  // When unauthenticated or explicitly requested, show public Landing Page gatekeeper
  if (isViewingLanding) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white">
        <LandingPage
          leads={leads}
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setIsAuthModalOpen(true);
          }}
          onEnterPortal={() => {
            if (!currentUser) {
              setAuthMode('login');
              setIsAuthModalOpen(true);
              showToast('Please sign in or register to enter the portal', 'info');
            } else {
              setViewMode('portal');
            }
          }}
          onOpenTopUp={(credits) => {
            if (credits && credits > 0) {
              setTopUpInitialCredits(credits);
            }
            if (!currentUser) {
              setAuthMode('register');
              setIsAuthModalOpen(true);
              showToast('Create a free account (3 free credits included) to top up', 'info');
            } else {
              setIsTopUpModalOpen(true);
            }
          }}
        />

        {/* Global Modals */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode}
        />

        <TopUpModal
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          initialCredits={topUpInitialCredits}
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 text-xs sm:text-sm font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-950/50'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/30 shadow-rose-950/50'
                : 'bg-slate-900/90 text-white border-purple-500/30 shadow-black/60'
            }`}>
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : toastMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0A0A0B] text-white selection:bg-purple-500/30 selection:text-purple-200">
      <LiquidBackground />

      {/* Artistic Flair Sidebar Navigation (Desktop) */}
      <aside className="hidden lg:flex w-[280px] shrink-0 border-r border-white/5 bg-[#0D0D0F] flex-col p-8 sticky top-0 h-screen overflow-y-auto select-none z-30">
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-3xl font-serif italic tracking-tight text-white">NullReach</h1>
            <span className="text-[9px] uppercase tracking-wider font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
              v2.1
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Enterprise Lead Portal</p>
        </div>

        <nav className="flex-1 space-y-7">
          {/* Navigation Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30">Views & Filters</h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, status: 'all', category: 'All', country: 'All' }));
                  }}
                  className={`w-full text-left flex items-center gap-3 py-1.5 px-2.5 rounded-xl transition cursor-pointer ${
                    filters.status === 'all' && filters.category === 'All' && filters.country === 'All'
                      ? 'text-white bg-white/5 font-medium'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    filters.status === 'all' && filters.category === 'All' && filters.country === 'All' ? 'bg-purple-500 ring-2 ring-purple-500/30' : 'bg-white/20'
                  }`} />
                  <span>All Directory</span>
                  <span className="ml-auto text-[10px] font-mono text-white/40">{filteredLeads.length}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, status: 'bookmarked' }));
                  }}
                  className={`w-full text-left flex items-center gap-3 py-1.5 px-2.5 rounded-xl transition cursor-pointer ${
                    filters.status === 'bookmarked'
                      ? 'text-white bg-white/5 font-medium'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    filters.status === 'bookmarked' ? 'bg-amber-400 ring-2 ring-amber-400/30' : 'bg-white/20'
                  }`} />
                  <span>Favorites / Bookmarks</span>
                  <span className="ml-auto text-[10px] font-mono text-amber-400/80">{bookmarkedCount}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, status: 'unlocked' }));
                  }}
                  className={`w-full text-left flex items-center gap-3 py-1.5 px-2.5 rounded-xl transition cursor-pointer ${
                    filters.status === 'unlocked'
                      ? 'text-white bg-white/5 font-medium'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    filters.status === 'unlocked' ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-white/20'
                  }`} />
                  <span>Unlocked Contacts</span>
                  <span className="ml-auto text-[10px] font-mono text-emerald-400/80">{unlockedCount}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, status: 'viewed' }));
                  }}
                  className={`w-full text-left flex items-center gap-3 py-1.5 px-2.5 rounded-xl transition cursor-pointer ${
                    filters.status === 'viewed'
                      ? 'text-white bg-white/5 font-medium'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    filters.status === 'viewed' ? 'bg-purple-400 ring-2 ring-purple-400/30' : 'bg-white/20'
                  }`} />
                  <span>Recently Viewed</span>
                  <span className="ml-auto text-[10px] font-mono text-purple-400/80">{viewedCount}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* User Account & Profiles Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30">User & Testing</h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthMode('login');
                      setIsAuthModalOpen(true);
                    } else {
                      setIsProfileModalOpen(true);
                    }
                  }}
                  className="w-full text-left flex items-center gap-3 py-1.5 px-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/[0.05] transition font-medium cursor-pointer"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>My Profile & Notes</span>
                  <span className="ml-auto text-[9px] uppercase tracking-wider bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                    {currentUser?.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-full text-left flex items-center gap-3 py-1.5 px-2.5 rounded-xl text-amber-300/90 hover:text-amber-200 hover:bg-amber-400/10 transition text-xs font-semibold cursor-pointer"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
                  <span>Test Accounts (5 Users)</span>
                  <span className="ml-auto text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">READY</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="w-full text-left flex items-center gap-3 py-1.5 px-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.02] transition cursor-pointer"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span>Credit Ledger</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Admin Control Panel Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-purple-400/80 font-bold">Admin Controls</h3>
            <button
              id="sidebar-admin-panel-btn"
              onClick={handleOpenAdminPanel}
              className={`w-full py-2.5 px-3 rounded-2xl border text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                isAdmin
                  ? 'border-purple-500/40 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 shadow-lg shadow-purple-950/40'
                  : 'border-white/10 hover:border-white/20 bg-white/[0.02] text-white/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="font-bold">Admin Panel</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                isAdmin ? 'bg-purple-500/30 text-purple-200' : 'bg-white/10 text-white/40'
              }`}>
                {isAdmin ? (adminSettings.exclusiveLeadViewing ? 'EXCLUSIVE ON' : 'SETTINGS') : 'ADMIN'}
              </span>
            </button>
          </div>

          {/* Countries Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30">Countries</h3>
              <span className="text-[10px] font-mono text-white/30">{countries.length - 1}</span>
            </div>
            <ul className="space-y-1 text-sm max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {countries.map((c) => {
                const isSelected = filters.country === c;
                const count = c === 'All'
                  ? leads.length
                  : leads.filter(l => l.country === c).length;

                return (
                  <li key={c}>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, country: c }))}
                      className={`w-full text-left flex items-center justify-between py-1 px-2 rounded-lg text-xs transition cursor-pointer ${
                        isSelected
                          ? 'text-white bg-purple-500/20 border border-purple-500/30 font-medium'
                          : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
                      }`}
                    >
                      <span className="truncate pr-1">{c === 'All' ? 'All Countries' : c}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-purple-500/30 text-purple-200' : 'text-white/30'
                      }`}>
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Categories Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30">Industries</h3>
              <span className="text-[10px] font-mono text-white/30">{categories.length - 1}</span>
            </div>
            <ul className="space-y-1 text-sm max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {categories.map((cat) => {
                const isSelected = filters.category === cat;
                const count = cat === 'All'
                  ? leads.length
                  : leads.filter(l => l.category === cat).length;

                return (
                  <li key={cat}>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
                      className={`w-full text-left flex items-center justify-between py-1 px-2 rounded-lg text-xs transition cursor-pointer ${
                        isSelected
                          ? 'text-white bg-purple-500/20 border border-purple-500/30 font-medium'
                          : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
                      }`}
                    >
                      <span className="truncate pr-1">{cat === 'All' ? 'All Industries' : cat}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-purple-500/30 text-purple-200' : 'text-white/30'
                      }`}>
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Upload CSV Data Trigger in Sidebar (Admin-Restricted) */}
        <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
          <button
            id="sidebar-upload-btn"
            onClick={handleTriggerUpload}
            className={`w-full py-2.5 px-3 border rounded-2xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
              isAdmin
                ? 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 shadow-md shadow-purple-950/30'
                : 'border-white/10 hover:border-white/20 bg-white/[0.02] text-white/50 hover:text-white'
            }`}
            title={isAdmin ? "Admin: Upload new CSV from Google Sheets" : "Restricted: Admin access required"}
          >
            <div className="flex items-center gap-2 truncate">
              {isAdmin ? (
                <Upload className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-white/40 shrink-0" />
              )}
              <span className="truncate">{isAdmin ? 'Upload CSV Data' : 'Upload Sheet'}</span>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
              isAdmin ? 'bg-purple-500/30 text-purple-200' : 'bg-white/10 text-white/40'
            }`}>
              {isAdmin ? 'ADMIN' : 'RESTRICTED'}
            </span>
          </button>

          {/* User Account & Logout Card */}
          {currentUser && (
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-2">
              <div 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                title="Click to view full profile & saved leads"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-serif text-white text-xs font-bold shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-white/40 truncate">
                    {currentUser.credits} Credits • {currentUser.role === 'admin' ? 'Admin' : 'Member'}
                  </div>
                </div>
              </div>

              <button
                id="sidebar-logout-btn"
                onClick={() => {
                  logout();
                  showToast('You have been signed out successfully', 'info');
                }}
                className="p-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 border border-rose-500/30 transition shrink-0 cursor-pointer"
                title="Log out of account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col relative overflow-x-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-[-100px] right-[-50px] w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[10%] w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Top Notification Strip */}
        <div className="bg-gradient-to-r from-purple-950/40 via-[#0A0A0B] to-blue-950/40 border-b border-white/5 py-2 px-6 sm:px-10 text-xs text-white/60 backdrop-blur-md flex items-center justify-between gap-4 flex-wrap z-20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-white/80 font-medium">{adminSettings.registrationBonusCredits} Free Credits on Registration</span>
            <span className="text-white/20">•</span>
            <span>{adminSettings.costPerUnlock === 0 ? 'Free Leads' : `${adminSettings.costPerUnlock} Credit per Lead Reveal`}</span>
            {adminSettings.exclusiveLeadViewing && (
              <>
                <span className="text-white/20">•</span>
                <span className="text-purple-300 font-medium">🔒 Exclusive Lead Visibility Active</span>
              </>
            )}
          </div>
          <button
            onClick={() => setIsTopUpModalOpen(true)}
            className="text-xs uppercase tracking-widest font-bold text-purple-400 hover:text-purple-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>1 Credit = $0.99 USD (Max 50)</span>
          </button>
        </div>

        {/* Artistic Flair Header Bar */}
        <header className="h-[88px] sm:h-[100px] border-b border-white/5 flex items-center justify-between px-6 sm:px-10 relative z-20 gap-4">
          
          {/* Search Pill with ⌘ K shortcut */}
          <div className="relative flex items-center bg-white/5 rounded-full px-5 py-2.5 border border-white/10 w-full max-w-[420px] focus-within:border-purple-400/50 focus-within:bg-white/[0.08] transition-all">
            <Search className="w-4 h-4 text-white/30 mr-3 shrink-0" />
            <input
              id="leads-search-input"
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search by name, company, country, city, notes..."
              className="bg-transparent text-xs sm:text-sm text-white placeholder:text-white/30 outline-none w-full"
            />
            {filters.searchQuery ? (
              <button
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                className="text-white/40 hover:text-white text-xs ml-2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="ml-auto text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/50 font-mono shrink-0 hidden sm:block">
                ⌘ K
              </div>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            
            {/* Admin Panel Header Button */}
            {isAdmin && (
              <button
                id="header-admin-panel-btn"
                onClick={handleOpenAdminPanel}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 transition shadow-md shadow-purple-950/30 cursor-pointer"
                title="Open Admin Control Panel"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1 py-0.2 rounded font-mono">
                  {claimedCount > 0 ? `${claimedCount} CLAIMED` : 'CTRL'}
                </span>
              </button>
            )}

            {/* Mobile upload button (Admin-Restricted) */}
            <button
              onClick={handleTriggerUpload}
              className={`lg:hidden p-2.5 rounded-full border transition cursor-pointer ${
                isAdmin
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:text-white'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
              }`}
              title={isAdmin ? "Upload CSV Sheet (Admin)" : "Admin access required"}
            >
              {isAdmin ? <Upload className="w-4 h-4 text-purple-400" /> : <Lock className="w-4 h-4 text-white/40" />}
            </button>

            {/* Balance Badge */}
            <div
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-2.5 bg-white/5 px-4 py-2 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition shadow-inner"
              title="View credit balance and ledger"
            >
              <span className="text-xs text-white/50 hidden sm:inline">Balance:</span>
              <span className="text-sm font-bold text-purple-400 font-mono tracking-tight">
                {currentUser ? currentUser.credits.toString().padStart(2, '0') : '03'} Credits
              </span>
            </div>

            {/* Top Up Button */}
            <button
              id="top-header-topup-btn"
              onClick={() => setIsTopUpModalOpen(true)}
              className="px-4 sm:px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-bold uppercase tracking-widest transition shadow-lg shadow-purple-950/40 cursor-pointer"
            >
              Top Up
            </button>

            {/* Landing Page View Toggle */}
            <button
              id="header-landing-toggle-btn"
              onClick={() => setViewMode('landing')}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition cursor-pointer"
              title="Switch to Landing Page"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Landing Page</span>
            </button>

            {/* User Profile Avatar with role indicator badge */}
            <div className="flex items-center gap-2">
              <button
                id="header-profile-btn"
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  } else {
                    setIsProfileModalOpen(true);
                  }
                }}
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/90 transition shadow-sm cursor-pointer"
                title="Open user profile & saved leads"
              >
                <span>Profile</span>
                <span className="text-[10px] text-purple-300 font-mono font-semibold">
                  {bookmarkedCount + unlockedCount > 0 ? `(${bookmarkedCount + unlockedCount})` : ''}
                </span>
              </button>

              <div
                id="user-avatar-btn"
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  } else {
                    setIsProfileModalOpen(true);
                  }
                }}
                className="relative h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 border-2 border-white/10 flex items-center justify-center font-serif text-white text-sm cursor-pointer shadow-md hover:scale-105 transition-transform"
                title={currentUser ? `${currentUser.name} (${currentUser.role}) - Click to view profile` : 'Sign In / Register'}
              >
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : '✦'}
                {currentUser?.role === 'admin' && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-500 border-2 border-[#0A0A0B] rounded-full" title="Administrator" />
                )}
              </div>

              {/* Dedicated Header Logout Button */}
              {currentUser && (
                <button
                  id="header-logout-btn"
                  onClick={() => {
                    logout();
                    showToast('You have been signed out successfully', 'info');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
                  title="Sign out of account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Section Container */}
        <section className="flex-1 px-6 sm:px-10 py-8 relative z-10">
          
          {/* Heading Row matching Artistic Flair */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-purple-400 font-medium mb-1">
                {sheetName}
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif italic text-white/90">
                {filters.status === 'bookmarked'
                  ? 'Bookmarked & Favorited Leads'
                  : filters.status === 'unlocked' 
                  ? 'Unlocked Contacts' 
                  : filters.status === 'viewed'
                  ? 'Recently Viewed Leads'
                  : (filters.country !== 'All' 
                    ? `Leads in ${filters.country}` 
                    : (filters.category === 'All' ? `Welcome, ${currentUser?.name || 'User'}` : `Found in ${filters.category}`))}
              </h2>
            </div>
            
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/40">
              <span>Showing {filteredLeads.length} of {leads.length}</span>
              {(filters.category !== 'All' || filters.country !== 'All' || filters.searchQuery || filters.status !== 'all') && (
                <button
                  onClick={() => setFilters({
                    searchQuery: '',
                    category: 'All',
                    country: 'All',
                    location: '',
                    status: 'all',
                    sortBy: 'recent'
                  })}
                  className="text-purple-400 hover:text-purple-300 underline lowercase transition cursor-pointer"
                >
                  (clear all filters)
                </button>
              )}
            </div>
          </div>

          {/* Quick Filters Bar (Status & Sort + Country Selector) */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Status Pills */}
              <div className="flex items-center p-1 rounded-full bg-white/5 border border-white/10">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                    filters.status === 'all'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  All ({leads.length})
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, status: 'unlocked' }))}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                    filters.status === 'unlocked'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  <span>Unlocked</span>
                  <span className="text-[10px] opacity-75">({unlockedCount})</span>
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, status: 'locked' }))}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                    filters.status === 'locked'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Locked
                </button>
              </div>

              {/* Filters Controls Group: Country Selector + Sort */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Country Filter Dropdown */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                  <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="uppercase tracking-widest text-[10px] text-white/40">Country:</span>
                  <select
                    id="country-filter-select"
                    value={filters.country || 'All'}
                    onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                    className="bg-transparent text-white font-medium outline-none cursor-pointer text-xs"
                  >
                    <option value="All" className="bg-[#0D0D0F] text-white">All Countries ({countries.length - 1})</option>
                    {countries.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c} className="bg-[#0D0D0F] text-white">{c}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Control */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50">
                  <ArrowUpDown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="uppercase tracking-widest text-[10px]">Sort:</span>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
                    className="bg-transparent text-white font-medium outline-none cursor-pointer text-xs"
                  >
                    <option value="recent" className="bg-[#0D0D0F] text-white">Default Sheet Order</option>
                    <option value="name" className="bg-[#0D0D0F] text-white">Name (A-Z)</option>
                    <option value="company" className="bg-[#0D0D0F] text-white">Company (A-Z)</option>
                    <option value="category" className="bg-[#0D0D0F] text-white">Category</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Mobile / Tablet Horizontal Category Scroll */}
            <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => {
                const isSelected = filters.category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
                    className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-950/40'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/60'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Grid */}
          {filteredLeads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  isUnlocked={isLeadUnlocked(lead.id)}
                  onOpenLead={handleOpenLead}
                  onQuickUnlock={handleQuickUnlock}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white/[0.03] border border-white/5 rounded-[36px] p-12 text-center max-w-md mx-auto space-y-4 my-12">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-serif italic text-2xl text-white">
                No Leads Discovered
              </h3>
              <p className="text-xs text-white/40 leading-relaxed">
                {adminSettings.exclusiveLeadViewing
                  ? 'No leads match your search criteria, or active leads have been exclusively claimed by other users under current privacy rules.'
                  : 'No leads match your current search query, country, or category filters.'}
              </p>
              <button
                onClick={() => setFilters({
                  searchQuery: '',
                  category: 'All',
                  country: 'All',
                  location: '',
                  status: 'all',
                  sortBy: 'recent'
                })}
                className="px-6 py-2.5 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Artistic Flair Bottom Callout Banner */}
          <div className="mt-14 bg-gradient-to-r from-purple-900/40 via-blue-900/30 to-transparent border border-white/5 rounded-[32px] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
              <div className="text-base sm:text-lg italic font-serif text-white/95">
                Need more verified leads?
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white/10 rounded-full border border-white/20 text-xs font-bold text-white tracking-wide">
                  10 Credits = $2.00
                </div>
                <button
                  id="bottom-banner-topup-btn"
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-purple-950/50 active:scale-98 cursor-pointer"
                >
                  Top Up Now
                </button>
              </div>
            </div>

            <div className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-medium">
              Enterprise B2B Lead Intelligence v2.1
            </div>
          </div>

          {/* Portal Footer with Branding & Copyrights */}
          <footer className="mt-14 pt-8 pb-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <span className="font-serif italic font-bold text-white/80">NullReach</span>
                <span className="text-white/30">— Enterprise Lead Intelligence</span>
              </div>
              <div className="hidden sm:block text-white/20">•</div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/10 text-white/60 text-[11px]">
                <span>A product by</span>
                <span className="font-medium text-purple-300">usecodify</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 text-[11px]">
              <div>
                © {new Date().getFullYear()} NullReach. All rights reserved. A product by usecodify.
              </div>
              <div className="hidden sm:block text-white/20">•</div>
              <div className="text-white/30">
                Exclusive Pipeline Protection
              </div>
            </div>
          </footer>

        </section>
      </div>

      {/* Modals */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedLead(null);
        }}
        onOpenTopUp={() => setIsTopUpModalOpen(true)}
        onOpenAuth={() => {
          setAuthMode('register');
          setIsAuthModalOpen(true);
        }}
        onLeadClaimed={handleClaimLead}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onLeadsImported={handleLeadsImported}
        onOpenAuth={() => {
          setAuthMode('login');
          setIsAuthModalOpen(true);
        }}
      />

      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        initialCredits={topUpInitialCredits}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />

      <TransactionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onOpenTopUp={() => {
          setIsHistoryModalOpen(false);
          setIsTopUpModalOpen(true);
        }}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        leads={leads}
        onOpenLead={handleOpenLead}
        onOpenTopUp={() => {
          setIsProfileModalOpen(false);
          setIsTopUpModalOpen(true);
        }}
        onOpenAdminPanel={() => {
          setIsProfileModalOpen(false);
          setIsAdminPanelOpen(true);
        }}
      />

      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        leads={leads}
        uploadBatches={uploadBatches}
        onReleaseClaim={handleReleaseClaim}
        onReleaseAllClaims={handleReleaseAllClaims}
        onResetDataset={handleResetToDefault}
        onResetLeadsToDefault={handleResetToDefault}
        onOpenUpload={() => {
          setIsAdminPanelOpen(false);
          setIsUploadModalOpen(true);
        }}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 text-xs sm:text-sm font-medium ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-950/50'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/30 shadow-rose-950/50'
              : 'bg-slate-900/90 text-white border-purple-500/30 shadow-black/60'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainPortal />
    </AuthProvider>
  );
}
