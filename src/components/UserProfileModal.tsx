import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  ShieldCheck,
  Star,
  Lock,
  Unlock,
  Eye,
  Coins,
  Copy,
  Check,
  Building2,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
  KeyRound,
  CheckCircle2,
  Trash2,
  Sparkles,
  Layers,
  Edit3,
  Save,
  LogIn,
  LogOut
} from 'lucide-react';
import { Lead, User } from '../types';
import { useAuth, TEST_ACCOUNTS } from '../context/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
  onOpenTopUp: () => void;
  onOpenAdminPanel?: () => void;
}

type ProfileTab = 'bookmarks' | 'unlocked' | 'viewed' | 'accounts' | 'settings';

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  leads,
  onOpenLead,
  onOpenTopUp,
  onOpenAdminPanel,
}) => {
  const { 
    currentUser, 
    allUsers, 
    switchUser, 
    isLeadUnlocked, 
    isLeadBookmarked, 
    toggleBookmarkLead, 
    updateProfile,
    logout
  } = useAuth();

  const [activeTab, setActiveTab] = useState<ProfileTab>('bookmarks');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit profile form state
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editTitle, setEditTitle] = useState(currentUser?.title || '');
  const [editCompany, setEditCompany] = useState(currentUser?.company || '');
  const [editPassword, setEditPassword] = useState(currentUser?.password || '');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Keep form synced when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditTitle(currentUser.title || '');
      setEditCompany(currentUser.company || '');
      setEditPassword(currentUser.password || '');
    }
  }, [currentUser]);

  if (!isOpen || !currentUser) return null;

  const bookmarkedIds = currentUser.bookmarkedLeadIds || [];
  const unlockedIds = currentUser.unlockedLeadIds || [];
  const viewedIds = currentUser.viewedLeadIds || [];

  const bookmarkedLeads = leads.filter(l => bookmarkedIds.includes(l.id));
  const unlockedLeads = leads.filter(l => unlockedIds.includes(l.id));
  
  // Maintain chronological order of viewed leads
  const viewedLeads: Lead[] = viewedIds
    .map(id => leads.find(l => l.id === id))
    .filter((l): l is Lead => !!l);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateProfile({
      name: editName,
      title: editTitle,
      company: editCompany,
      password: editPassword,
    });
    if (res.success) {
      setSaveSuccess(res.message);
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const initials = currentUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="user-profile-modal-card"
        className="relative w-full max-w-4xl bg-[#0E0E10] border border-white/10 rounded-[36px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header & User Banner */}
        <div className="p-6 sm:p-8 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent relative">
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-serif text-2xl sm:text-3xl text-white shadow-xl border-2 ${
                  currentUser.role === 'admin'
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 border-purple-400/40'
                    : 'bg-gradient-to-tr from-blue-600 to-cyan-600 border-cyan-400/30'
                }`}>
                  {initials}
                </div>
                {currentUser.role === 'admin' && (
                  <div 
                    className="absolute -top-1 -right-1 p-1 bg-purple-600 text-white rounded-full shadow-md border border-[#0E0E10]"
                    title="Administrator Privilege"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Identity Info */}
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-serif italic text-2xl sm:text-3xl text-white tracking-tight">
                    {currentUser.name}
                  </h2>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-white/10 text-white/70 border-white/15'
                  }`}>
                    {currentUser.role === 'admin' ? 'Administrator' : 'Standard Member'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-white/50 font-mono mt-0.5">
                  {currentUser.email}
                </p>

                {(currentUser.title || currentUser.company) && (
                  <p className="text-xs text-purple-300/80 mt-1">
                    {currentUser.title} {currentUser.company ? `• ${currentUser.company}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Balance badge & Top-up action */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end bg-white/[0.02] sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-white/5">
              <div className="text-left sm:text-right">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Available Credits</div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-purple-300">
                  {currentUser.credits} <span className="text-xs text-white/50 font-sans">cr</span>
                </div>
              </div>
              <button
                id="profile-top-up-btn"
                onClick={onOpenTopUp}
                className="px-4 py-2 rounded-full bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5 text-black" />
                <span>Top Up</span>
              </button>

              <button
                id="profile-sign-out-header-btn"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/5">
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'bookmarks'
                  ? 'bg-amber-500/10 border-amber-500/30 shadow-sm'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Favorited Leads</span>
                <Star className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {bookmarkedLeads.length}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('unlocked')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'unlocked'
                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-sm'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Unlocked Contacts</span>
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {unlockedLeads.length}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('viewed')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'viewed'
                  ? 'bg-purple-500/10 border-purple-500/30 shadow-sm'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Viewed Intel</span>
                <Eye className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {viewedLeads.length}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTab === 'accounts'
                  ? 'bg-blue-500/10 border-blue-500/30 shadow-sm'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Test Accounts</span>
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {TEST_ACCOUNTS.length} Profiles
              </div>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 pt-3 border-b border-white/10 bg-white/[0.01] overflow-x-auto no-scrollbar">
          <button
            id="tab-bookmarks-btn"
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Saved / Bookmarks ({bookmarkedLeads.length})</span>
          </button>

          <button
            id="tab-unlocked-btn"
            onClick={() => setActiveTab('unlocked')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
              activeTab === 'unlocked'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Unlocked Leads ({unlockedLeads.length})</span>
          </button>

          <button
            id="tab-viewed-btn"
            onClick={() => setActiveTab('viewed')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
              activeTab === 'viewed'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Recently Viewed ({viewedLeads.length})</span>
          </button>

          <button
            id="tab-accounts-btn"
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
              activeTab === 'accounts'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Test Accounts & Passwords</span>
          </button>

          <button
            id="tab-settings-btn"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'border-white text-white'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          {currentUser.role === 'admin' && onOpenAdminPanel && (
            <button
              id="tab-admin-panel-btn"
              onClick={() => {
                onClose();
                onOpenAdminPanel();
              }}
              className="ml-auto flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>

        {/* Tab Body Contents */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: BOOKMARKED LEADS */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif italic text-xl text-white">
                    Bookmarked & Favorited Leads
                  </h3>
                  <p className="text-xs text-white/50">
                    High-priority prospects you have starred for follow-up and outreach.
                  </p>
                </div>
                <span className="text-xs text-amber-400/80 font-mono">
                  {bookmarkedLeads.length} saved
                </span>
              </div>

              {bookmarkedLeads.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                  <Star className="w-10 h-10 text-amber-400/30 mx-auto" />
                  <p className="text-sm text-white/60">
                    No bookmarked leads yet.
                  </p>
                  <p className="text-xs text-white/40 max-w-sm mx-auto">
                    Browse the database and click the star/bookmark icon on any lead card to save it here for fast retrieval.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookmarkedLeads.map((lead) => {
                    const unlocked = isLeadUnlocked(lead.id);
                    return (
                      <div
                        key={lead.id}
                        className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
                              {lead.title || 'Executive'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {unlocked ? (
                                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Unlocked
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                                  Locked
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleBookmarkLead(lead.id)}
                                className="p-1 rounded-lg text-amber-400 hover:text-white/60 hover:bg-white/5 transition"
                                title="Remove from favorites"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4 className="font-serif italic text-lg text-white group-hover:text-amber-300 transition-colors">
                            {lead.name}
                          </h4>
                          <p className="text-xs text-white/50 truncate">
                            {lead.company} {lead.location ? `• ${lead.location}` : ''}
                          </p>

                          <div className="mt-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono space-y-1">
                            <div className="flex justify-between items-center text-white/60">
                              <span className="text-[10px] uppercase tracking-wider text-white/30">Email:</span>
                              <span className={unlocked ? 'text-white' : 'blur-xs text-white/40'}>
                                {unlocked ? lead.email : '••••••••@' + (lead.company.toLowerCase().replace(/\s+/g, '') + '.com')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-white/40 uppercase tracking-wider">
                            {lead.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenLead(lead);
                            }}
                            className="text-xs font-semibold text-white hover:text-amber-300 flex items-center gap-1 transition"
                          >
                            <span>Open Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UNLOCKED LEADS */}
          {activeTab === 'unlocked' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif italic text-xl text-white">
                    Unlocked Direct Contacts
                  </h3>
                  <p className="text-xs text-white/50">
                    Contacts where you spent credits to reveal direct verified email and telephone coordinates.
                  </p>
                </div>
                <span className="text-xs text-emerald-400/80 font-mono">
                  {unlockedLeads.length} unlocked
                </span>
              </div>

              {unlockedLeads.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                  <Unlock className="w-10 h-10 text-emerald-400/30 mx-auto" />
                  <p className="text-sm text-white/60">
                    You haven't unlocked any leads yet.
                  </p>
                  <p className="text-xs text-white/40 max-w-sm mx-auto">
                    Unlock contact coordinates for 1 credit per lead. All your unlocked profiles will stay permanently accessible here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unlockedLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 sm:p-5 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif italic text-lg text-white truncate">
                            {lead.name}
                          </h4>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            VERIFIED
                          </span>
                        </div>
                        <p className="text-xs text-white/50">
                          {lead.title} at <strong className="text-white/80">{lead.company}</strong>
                        </p>
                        <div className="flex items-center gap-4 text-xs font-mono text-white/80 pt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-emerald-300">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{lead.email}</span>
                          </span>
                          <span className="flex items-center gap-1 text-white/60">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{lead.phone}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => handleCopy(`${lead.name} <${lead.email}> ${lead.phone}`, `unlocked-${lead.id}`)}
                          className="py-2 px-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          {copiedKey === `unlocked-${lead.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Intel</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenLead(lead);
                          }}
                          className="py-2 px-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition"
                        >
                          Full Dossier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECENTLY VIEWED LEADS */}
          {activeTab === 'viewed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif italic text-xl text-white">
                    Recently Inspected Dossiers
                  </h3>
                  <p className="text-xs text-white/50">
                    A chronological history of leads you have recently inspected in this portal.
                  </p>
                </div>
                <span className="text-xs text-purple-400/80 font-mono">
                  {viewedLeads.length} viewed
                </span>
              </div>

              {viewedLeads.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
                  <Eye className="w-10 h-10 text-purple-400/30 mx-auto" />
                  <p className="text-sm text-white/60">
                    No viewing history yet.
                  </p>
                  <p className="text-xs text-white/40 max-w-sm mx-auto">
                    Whenever you open a lead to inspect company details, financials, or contact data, it will be catalogued here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {viewedLeads.map((lead) => {
                    const unlocked = isLeadUnlocked(lead.id);
                    const bookmarked = isLeadBookmarked(lead.id);
                    return (
                      <div
                        key={lead.id}
                        className="py-3.5 flex items-center justify-between gap-4 group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-white group-hover:text-purple-300 transition-colors truncate">
                              {lead.name}
                            </h4>
                            <span className="text-[10px] text-white/40">
                              • {lead.company}
                            </span>
                            {unlocked && (
                              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-bold">
                                UNLOCKED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 truncate">
                            {lead.title} • {lead.category} • {lead.location}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleBookmarkLead(lead.id)}
                            className={`p-2 rounded-full transition ${
                              bookmarked 
                                ? 'text-amber-400 bg-amber-500/10' 
                                : 'text-white/30 hover:text-white hover:bg-white/5'
                            }`}
                            title={bookmarked ? "Favorited" : "Add to favorites"}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenLead(lead);
                            }}
                            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TEST ACCOUNTS & PASSWORDS (Explicit user requirement) */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 leading-relaxed">
                <strong>Pre-configured Demo Accounts:</strong> Use any of the credentials below to log in or switch personas. Admin accounts have full privileges including CSV upload, and member accounts simulate various team member states and credit balances.
              </div>

              <div className="space-y-3">
                {TEST_ACCOUNTS.map((acc, idx) => {
                  const isCurrent = currentUser.email.toLowerCase() === acc.email.toLowerCase();
                  const targetUser = allUsers.find(u => u.email.toLowerCase() === acc.email.toLowerCase());

                  return (
                    <div
                      key={idx}
                      className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                        isCurrent
                          ? 'bg-purple-900/20 border-purple-500/40 shadow-lg'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif italic text-base text-white font-bold">
                              {acc.name}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              acc.role === 'admin'
                                ? 'bg-purple-500/30 text-purple-200 border border-purple-500/30'
                                : 'bg-white/10 text-white/70'
                            }`}>
                              {acc.roleName}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Currently Active
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-white/50">
                            {acc.description}
                          </p>

                          {/* Credentials display with copy buttons */}
                          <div className="flex items-center gap-3 pt-2 flex-wrap text-xs font-mono">
                            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                              <span className="text-white/40">Username:</span>
                              <span className="text-purple-300">{acc.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(acc.email, `user-${idx}`)}
                                className="text-white/40 hover:text-white ml-1"
                                title="Copy username"
                              >
                                {copiedKey === `user-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                              <span className="text-white/40">Password:</span>
                              <span className="text-emerald-300 font-bold">{acc.password}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(acc.password, `pass-${idx}`)}
                                className="text-white/40 hover:text-white ml-1"
                                title="Copy password"
                              >
                                {copiedKey === `pass-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>

                            {targetUser && (
                              <div className="text-[11px] text-white/50">
                                Balance: <strong className="text-white">{targetUser.credits} credits</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Switch button */}
                        <div className="shrink-0 w-full sm:w-auto flex justify-end">
                          {isCurrent ? (
                            <span className="text-xs text-purple-300 font-semibold px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                              Active Account
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (targetUser) {
                                  switchUser(targetUser.id);
                                }
                              }}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <LogIn className="w-3.5 h-3.5 text-black" />
                              <span>Switch to this Profile</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: EDIT PROFILE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-5">
              <div>
                <h3 className="font-serif italic text-xl text-white">
                  Edit Personal Profile
                </h3>
                <p className="text-xs text-white/50">
                  Update your contact metadata, professional title, and access password.
                </p>
              </div>

              {saveSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">
                      Professional Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="e.g. VP of Growth"
                      className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      placeholder="e.g. Apex Ventures"
                      className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">
                    Account Password
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-purple-400 transition"
                  />
                  <p className="text-[11px] text-white/40 mt-1">
                    Plaintext password saved for this session and local storage.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Profile Synced to Local Workspace</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              id="profile-footer-sign-out-btn"
              onClick={() => {
                logout();
                onClose();
              }}
              className="text-xs uppercase tracking-widest text-rose-400 hover:text-rose-300 font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition cursor-pointer"
            >
              Close Profile
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
