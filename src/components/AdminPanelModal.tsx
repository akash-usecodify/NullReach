import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Users, 
  Coins, 
  Sliders, 
  RotateCcw, 
  Check, 
  Download, 
  Upload, 
  Lock, 
  Unlock, 
  Star, 
  FileText, 
  Building2, 
  Globe2, 
  Share2, 
  Sparkles,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Layers,
  Search,
  Filter,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ArrowRight,
  Info
} from 'lucide-react';
import { Lead, UserRole, UploadBatch } from '../types';
import { useAuth } from '../context/AuthContext';
import { AdminLeadDossierModal } from './AdminLeadDossierModal';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  uploadBatches?: UploadBatch[];
  onOpenUpload: () => void;
  onReleaseClaim: (leadId: string) => void;
  onReleaseAllClaims: () => void;
  onResetDataset?: () => void;
  onResetLeadsToDefault?: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  leads,
  uploadBatches = [],
  onOpenUpload,
  onReleaseClaim,
  onReleaseAllClaims,
  onResetDataset,
  onResetLeadsToDefault,
}) => {
  const { 
    currentUser, 
    isAdmin, 
    adminSettings, 
    updateAdminSettings, 
    allUsers, 
    updateUserCreditsAdmin, 
    changeUserRoleAdmin 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'leads' | 'exclusivity' | 'credits' | 'display' | 'users' | 'database' | 'emails'>('leads');
  const [creditInputUserId, setCreditInputUserId] = useState<string | null>(null);
  const [customCreditDelta, setCustomCreditDelta] = useState<number>(10);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Email Notification & Alert State
  const [emailConfig, setEmailConfig] = useState<{ isConfigured: boolean; provider: string; senderEmail: string; adminAlertEmail: string; instructions?: any } | null>(null);
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);
  const [testAlertResult, setTestAlertResult] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/email/config')
        .then(res => res.json())
        .then(data => setEmailConfig(data))
        .catch(err => console.warn('Failed to load email config:', err));
    }
  }, [isOpen]);

  const handleSendTestAlert = async () => {
    setIsSendingTestAlert(true);
    setTestAlertResult(null);
    try {
      const res = await fetch('/api/email/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        if (data.provider === 'none') {
          setTestAlertResult(`Simulation Logged: Alert generated for ${data.testedAdminEmail}. Live inbox delivery will start immediately once RESEND_API_KEY is supplied.`);
        } else {
          setTestAlertResult(`Live Alert Dispatched: Successfully delivered via ${data.provider.toUpperCase()} to ${data.testedAdminEmail}!`);
        }
        showNotice('Test email alert triggered');
      } else {
        setTestAlertResult(`Error: ${data.error || 'Failed to dispatch test alert'}`);
      }
    } catch (err: any) {
      setTestAlertResult(`Network error: ${err.message}`);
    } finally {
      setIsSendingTestAlert(false);
    }
  };

  // Leads Inspector tab filters & state
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('All');
  const [claimStatusFilter, setClaimStatusFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [inspectedLead, setInspectedLead] = useState<Lead | null>(null);

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const handleResetAction = () => {
    if (onResetDataset) {
      onResetDataset();
    } else if (onResetLeadsToDefault) {
      onResetLeadsToDefault();
    }
  };

  // Find all claimed leads
  const claimedLeads = leads.filter(l => !!l.claimedByUserId);

  // Distinct countries
  const countries = Array.from(new Set(leads.map(l => l.country).filter(Boolean))).sort();

  // Distinct batches available in leads or uploadBatches
  const allBatchesList: { id: string; name: string; count: number; timestamp?: string }[] = [];
  const registeredBatchIds = new Set<string>();

  // Add recorded upload batches
  uploadBatches.forEach(b => {
    allBatchesList.push({
      id: b.id,
      name: b.sheetName,
      count: b.leadCount,
      timestamp: b.timestamp
    });
    registeredBatchIds.add(b.id);
  });

  // Also include any batchName from leads not already in uploadBatches
  leads.forEach(l => {
    if (l.batchId && !registeredBatchIds.has(l.batchId)) {
      allBatchesList.push({
        id: l.batchId,
        name: l.batchName || 'Uploaded Lead Sheet',
        count: leads.filter(x => x.batchId === l.batchId).length,
        timestamp: l.uploadedAt
      });
      registeredBatchIds.add(l.batchId);
    }
  });

  // Filter leads for admin table
  const adminFilteredLeads = leads.filter(l => {
    if (selectedBatchFilter !== 'All') {
      if (l.batchId !== selectedBatchFilter && l.batchName !== selectedBatchFilter) {
        return false;
      }
    }

    if (claimStatusFilter === 'claimed' && !l.claimedByUserId) return false;
    if (claimStatusFilter === 'unclaimed' && l.claimedByUserId) return false;

    if (countryFilter !== 'All' && l.country !== countryFilter) return false;

    if (leadSearchQuery.trim()) {
      const q = leadSearchQuery.toLowerCase().trim();
      const match = 
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.location || '').toLowerCase().includes(q) ||
        (l.country || '').toLowerCase().includes(q) ||
        (l.category || '').toLowerCase().includes(q) ||
        (l.notes || '').toLowerCase().includes(q) ||
        (l.claimedByUserName || '').toLowerCase().includes(q) ||
        (l.batchName || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleExportCsv = () => {
    const headers = [
      'ID', 'Name', 'Title', 'Company', 'Category', 'Country', 'Location', 
      'Email', 'Phone', 'Website', 'Revenue', 'Google Business URL', 'Google Rating', 
      'Google Reviews', 'LinkedIn', 'Twitter', 'Claimed By User ID', 'Claimed By Name', 'Claimed At', 'Batch Name', 'Uploaded At'
    ];

    const rows = leads.map(l => [
      `"${l.id}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.company.replace(/"/g, '""')}"`,
      `"${l.category.replace(/"/g, '""')}"`,
      `"${(l.country || '').replace(/"/g, '""')}"`,
      `"${l.location.replace(/"/g, '""')}"`,
      `"${l.email.replace(/"/g, '""')}"`,
      `"${l.phone.replace(/"/g, '""')}"`,
      `"${(l.website || '').replace(/"/g, '""')}"`,
      `"${(l.revenue || '').replace(/"/g, '""')}"`,
      `"${(l.googleBusinessUrl || '').replace(/"/g, '""')}"`,
      `"${l.googleRating || ''}"`,
      `"${l.googleReviewsCount || ''}"`,
      `"${(l.socials?.linkedin || l.linkedin || '').replace(/"/g, '""')}"`,
      `"${(l.socials?.twitter || '').replace(/"/g, '""')}"`,
      `"${(l.claimedByUserId || '').replace(/"/g, '""')}"`,
      `"${(l.claimedByUserName || '').replace(/"/g, '""')}"`,
      `"${(l.claimedAt || '').replace(/"/g, '""')}"`,
      `"${(l.batchName || '').replace(/"/g, '""')}"`,
      `"${(l.uploadedAt || '').replace(/"/g, '""')}"`,
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nullreach_leads_database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('NullReach database exported to CSV successfully');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-[#0A0A0B]/85 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />

        {/* Main Container */}
        <div 
          id="admin-panel-modal"
          className="relative w-full max-w-6xl bg-[#0D0D10] rounded-[28px] sm:rounded-[36px] shadow-2xl border border-purple-500/25 z-10 animate-in fade-in zoom-in-95 duration-200 text-white overflow-hidden flex flex-col max-h-[94vh]"
        >
          {/* Header Bar */}
          <div className="p-5 sm:p-7 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-950/30 via-transparent to-blue-950/20">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                    NullReach Admin Intelligence
                  </span>
                  <span className="text-xs text-white/50 font-mono">
                    {leads.length} Total Leads • {claimedLeads.length} Claimed
                  </span>
                </div>
                <h2 className="font-serif italic text-2xl sm:text-3xl text-white mt-0.5">
                  Admin Control & Lead Intelligence Panel
                </h2>
              </div>
            </div>

            <button
              id="close-admin-panel-btn"
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback Notice Banner */}
          {feedbackNotice && (
            <div className="bg-purple-950/60 border-b border-purple-500/30 px-6 py-2.5 text-xs text-purple-200 flex items-center gap-2 animate-in fade-in duration-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 shrink-0" />
              <span>{feedbackNotice}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 sm:gap-2 px-6 pt-3 border-b border-white/5 overflow-x-auto shrink-0 bg-white/[0.01]">
            
            {/* TAB: Uploaded Leads & Batches */}
            <button
              onClick={() => setActiveTab('leads')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                activeTab === 'leads'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Uploaded Leads & Batches ({leads.length})</span>
            </button>

            {/* TAB: Exclusivity */}
            <button
              onClick={() => setActiveTab('exclusivity')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                activeTab === 'exclusivity'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Exclusivity & Isolation ({claimedLeads.length})</span>
            </button>

            {/* TAB: Credit Rules */}
            <button
              onClick={() => setActiveTab('credits')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                activeTab === 'credits'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Credit Rules</span>
            </button>

            {/* TAB: Details & Toggles */}
            <button
              onClick={() => setActiveTab('display')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                activeTab === 'display'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Details & Toggles</span>
            </button>

            {/* TAB: Users */}
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team & Accounts ({allUsers.length})</span>
            </button>

            {/* TAB: Database Controls */}
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                activeTab === 'database'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Dataset Controls</span>
            </button>

            {/* TAB: Email Alerts & Automation */}
            <button
              id="admin-tab-emails"
              onClick={() => setActiveTab('emails')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
                activeTab === 'emails'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Alerts & Registration</span>
              {emailConfig?.isConfigured ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live Email Active" />
              ) : (
                <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">Config</span>
              )}
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
            
            {/* TAB: UPLOADED LEADS & BATCHES (DEEP INSPECTOR) */}
            {activeTab === 'leads' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                
                {/* Batches Header & Quick Upload Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4 sm:p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <h3 className="text-base font-semibold text-white">Upload History & Lead Sheets</h3>
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      All lead sheets previously uploaded to NullReach. Past records and user accounts are permanently preserved across uploads.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenUpload();
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-purple-950/40 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Sheet</span>
                    </button>
                    <button
                      onClick={handleExportCsv}
                      className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl text-xs font-semibold transition border border-white/10 cursor-pointer"
                      title="Download full CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Export All</span>
                    </button>
                  </div>
                </div>

                {/* Upload Batches Grid */}
                {allBatchesList.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                        Previously Uploaded Batches ({allBatchesList.length})
                      </span>
                      {selectedBatchFilter !== 'All' && (
                        <button
                          onClick={() => setSelectedBatchFilter('All')}
                          className="text-[10px] text-purple-400 hover:text-purple-300 underline lowercase"
                        >
                          (clear batch filter)
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {allBatchesList.map((batch) => {
                        const isSelected = selectedBatchFilter === batch.id || selectedBatchFilter === batch.name;
                        const leadCountInBatch = leads.filter(l => l.batchId === batch.id || l.batchName === batch.name).length;
                        return (
                          <div 
                            key={batch.id}
                            onClick={() => setSelectedBatchFilter(isSelected ? 'All' : batch.id)}
                            className={`p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                              isSelected
                                ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/30'
                                : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-semibold text-white text-xs truncate max-w-[180px]">
                                {batch.name}
                              </div>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                                isSelected ? 'bg-purple-500 text-white' : 'bg-white/10 text-purple-300'
                              }`}>
                                {leadCountInBatch} Leads
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-white/40 font-mono">
                              <span>{batch.timestamp ? new Date(batch.timestamp).toLocaleDateString() : 'System Sheet'}</span>
                              <span className="text-purple-400 font-sans font-medium text-[10px]">
                                {isSelected ? 'Active Filter ✓' : 'Click to filter'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filter and Search Bar for Deep Table */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    
                    {/* Search Input */}
                    <div className="relative flex-1 flex items-center bg-white/5 rounded-xl px-3 py-2 border border-white/10 focus-within:border-purple-500/50">
                      <Search className="w-4 h-4 text-white/30 mr-2 shrink-0" />
                      <input
                        type="text"
                        value={leadSearchQuery}
                        onChange={(e) => setLeadSearchQuery(e.target.value)}
                        placeholder="Search lead name, company, email, phone, city, notes, claimed user..."
                        className="bg-transparent text-xs text-white placeholder:text-white/30 outline-none w-full"
                      />
                      {leadSearchQuery && (
                        <button onClick={() => setLeadSearchQuery('')} className="text-white/40 hover:text-white text-xs ml-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Exclusivity Filter */}
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                      <button
                        onClick={() => setClaimStatusFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition font-medium ${
                          claimStatusFilter === 'all' ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white'
                        }`}
                      >
                        All ({leads.length})
                      </button>
                      <button
                        onClick={() => setClaimStatusFilter('claimed')}
                        className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
                          claimStatusFilter === 'claimed' ? 'bg-amber-600 text-white' : 'text-white/50 hover:text-white'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>Claimed ({claimedLeads.length})</span>
                      </button>
                      <button
                        onClick={() => setClaimStatusFilter('unclaimed')}
                        className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
                          claimStatusFilter === 'unclaimed' ? 'bg-emerald-600 text-white' : 'text-white/50 hover:text-white'
                        }`}
                      >
                        <Unlock className="w-3 h-3" />
                        <span>Available ({leads.length - claimedLeads.length})</span>
                      </button>
                    </div>

                    {/* Country Filter */}
                    {countries.length > 0 && (
                      <select
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className="bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="All">All Countries ({countries.length})</option>
                        {countries.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}

                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                    <span>
                      Displaying <strong>{adminFilteredLeads.length}</strong> of {leads.length} stored leads
                    </span>
                    {(leadSearchQuery || selectedBatchFilter !== 'All' || claimStatusFilter !== 'all' || countryFilter !== 'All') && (
                      <button
                        onClick={() => {
                          setLeadSearchQuery('');
                          setSelectedBatchFilter('All');
                          setClaimStatusFilter('all');
                          setCountryFilter('All');
                        }}
                        className="text-purple-400 hover:text-purple-300 underline lowercase cursor-pointer"
                      >
                        reset table filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Deep Detailed Leads Table */}
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <div className="overflow-x-auto max-h-[460px] scrollbar-thin scrollbar-thumb-white/10">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-[#121217] z-10">
                        <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-[10px]">
                          <th className="py-3 px-4">Contact & Role</th>
                          <th className="py-3 px-4">Company & Location</th>
                          <th className="py-3 px-4">Direct Contact</th>
                          <th className="py-3 px-4">Google Profile & Rating</th>
                          <th className="py-3 px-4">Socials</th>
                          <th className="py-3 px-4">Exclusivity Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        {adminFilteredLeads.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-white/40 italic">
                              No leads found matching your search and filter criteria.
                            </td>
                          </tr>
                        ) : (
                          adminFilteredLeads.map((lead) => {
                            const isClaimed = !!lead.claimedByUserId;
                            const hasSocials = !!(lead.socials?.linkedin || lead.socials?.twitter || lead.linkedin);

                            return (
                              <tr 
                                key={lead.id} 
                                className="hover:bg-white/[0.03] transition group"
                              >
                                {/* Contact & Role */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    {lead.logoUrl ? (
                                      <img 
                                        src={lead.logoUrl} 
                                        alt={lead.company}
                                        className="w-8 h-8 rounded-lg object-cover border border-white/10 bg-white/5 shrink-0"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-700 flex items-center justify-center font-serif text-white text-xs shrink-0 font-bold">
                                        {lead.company.charAt(0)}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-serif italic font-medium text-white text-sm">
                                        {lead.name}
                                      </div>
                                      <div className="text-[11px] text-purple-300/80 truncate max-w-[170px]">
                                        {lead.title}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Company & Location */}
                                <td className="py-3 px-4">
                                  <div className="font-medium text-white">{lead.company}</div>
                                  <div className="text-[11px] text-white/40 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                                    <span className="truncate max-w-[140px]">{lead.location}</span>
                                    {lead.country && (
                                      <span className="text-[9px] bg-white/5 px-1 rounded text-white/60">
                                        {lead.country}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Direct Contact */}
                                <td className="py-3 px-4 font-mono text-[11px]">
                                  <div className="text-white/90 truncate max-w-[180px]">{lead.email}</div>
                                  <div className="text-white/40 mt-0.5">{lead.phone}</div>
                                </td>

                                {/* Google Business */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1 text-white font-medium">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span>{lead.googleRating || '4.8'}</span>
                                    <span className="text-white/40 text-[10px]">
                                      ({lead.googleReviewsCount || 120})
                                    </span>
                                  </div>
                                  {lead.googleBusinessUrl && (
                                    <a
                                      href={lead.googleBusinessUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-0.5"
                                    >
                                      <span>Maps Profile</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </td>

                                {/* Socials */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5 text-white/50">
                                    {(lead.socials?.linkedin || lead.linkedin) && (
                                      <a 
                                        href={lead.socials?.linkedin || lead.linkedin} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="hover:text-purple-300" 
                                        title="LinkedIn"
                                      >
                                        <Share2 className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    {lead.website && (
                                      <a 
                                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="hover:text-purple-300" 
                                        title="Website"
                                      >
                                        <Globe2 className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    {!hasSocials && !lead.website && (
                                      <span className="text-[10px] text-white/20">—</span>
                                    )}
                                  </div>
                                </td>

                                {/* Exclusivity Status */}
                                <td className="py-3 px-4">
                                  {isClaimed ? (
                                    <div className="space-y-1">
                                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                                        <Lock className="w-2.5 h-2.5" />
                                        <span>Claimed</span>
                                      </div>
                                      <div className="text-[10px] text-white/70 font-semibold truncate max-w-[130px]">
                                        {lead.claimedByUserName || 'User'}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-mono">
                                      <Unlock className="w-2.5 h-2.5" />
                                      <span>Available</span>
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="py-3 px-4 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      onClick={() => setInspectedLead(lead)}
                                      className="px-2.5 py-1 bg-white/5 hover:bg-purple-600/30 text-purple-300 hover:text-white rounded-lg text-[11px] font-medium transition cursor-pointer border border-white/10"
                                      title="Inspect complete lead dossier"
                                    >
                                      Inspect Dossier
                                    </button>

                                    {isClaimed && (
                                      <button
                                        onClick={() => {
                                          onReleaseClaim(lead.id);
                                          showNotice(`Released claim for ${lead.name}`);
                                        }}
                                        className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-[11px] transition cursor-pointer border border-rose-500/20"
                                        title="Release claim back to public"
                                      >
                                        <Unlock className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: EXCLUSIVITY & ISOLATION */}
            {activeTab === 'exclusivity' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                
                {/* Primary Switch: Exclusive Lead Viewing */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-semibold text-white">
                          Exclusive Lead Viewing Mode
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
                          adminSettings.exclusiveLeadViewing 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                            : 'bg-white/10 text-white/50'
                        }`}>
                          {adminSettings.exclusiveLeadViewing ? 'ACTIVE • STRICT ISOLATION' : 'DISABLED • SHARED VIEW'}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed max-w-xl">
                        When enabled, as soon as a user clicks to view or unlock a lead, that lead is immediately claimed and hidden from all other users in their directory, search, and category views.
                      </p>
                    </div>

                    <button
                      id="toggle-exclusive-viewing-btn"
                      onClick={() => {
                        const next = !adminSettings.exclusiveLeadViewing;
                        updateAdminSettings({ exclusiveLeadViewing: next });
                        showNotice(next ? 'Exclusive lead isolation enabled' : 'Lead exclusivity disabled');
                      }}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-lg shrink-0 ${
                        adminSettings.exclusiveLeadViewing
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/50'
                          : 'bg-white/10 hover:bg-white/20 text-white/60 hover:text-white'
                      }`}
                    >
                      {adminSettings.exclusiveLeadViewing ? 'Exclusivity: ON' : 'Exclusivity: OFF'}
                    </button>
                  </div>

                  {/* Sub-option: Admin can bypass isolation */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-white flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-purple-400" />
                        <span>Admin Directory Bypass</span>
                      </div>
                      <p className="text-[11px] text-white/40">
                        Allow administrators to still inspect all claimed leads in the public directory while hiding them from members.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const next = !adminSettings.adminCanViewAllLeads;
                        updateAdminSettings({ adminCanViewAllLeads: next });
                        showNotice(next ? 'Admin bypass enabled' : 'Admin bypass disabled');
                      }}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition cursor-pointer ${
                        adminSettings.adminCanViewAllLeads ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {adminSettings.adminCanViewAllLeads ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>

                {/* Currently Claimed Leads List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Active Exclusive Claims</h3>
                      <p className="text-xs text-white/50">Leads that have been claimed and are currently hidden from other users.</p>
                    </div>
                    {claimedLeads.length > 0 && (
                      <button
                        onClick={() => {
                          if (window.confirm('Release all claimed leads back to the public directory?')) {
                            onReleaseAllClaims();
                            showNotice('All claimed leads released back to public');
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Release All Claims ({claimedLeads.length})
                      </button>
                    )}
                  </div>

                  {claimedLeads.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-white/40">
                      No leads are currently claimed. Every lead in the directory is visible to members until opened.
                    </div>
                  ) : (
                    <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/5 bg-white/[0.03] text-white/40 uppercase tracking-widest text-[10px]">
                            <th className="py-3 px-4">Lead</th>
                            <th className="py-3 px-4">Company</th>
                            <th className="py-3 px-4">Claimed By</th>
                            <th className="py-3 px-4">Claim Time</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {claimedLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-white/[0.02] transition">
                              <td className="py-3 px-4">
                                <div className="font-medium text-white">{lead.name}</div>
                                <div className="text-[11px] text-white/40">{lead.title}</div>
                              </td>
                              <td className="py-3 px-4 text-purple-300">{lead.company}</td>
                              <td className="py-3 px-4">
                                <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[11px] font-mono">
                                  {lead.claimedByUserName || lead.claimedByUserId}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-white/40 font-mono text-[11px]">
                                {lead.claimedAt ? new Date(lead.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => {
                                    onReleaseClaim(lead.id);
                                    showNotice(`Released claim on ${lead.name}`);
                                  }}
                                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-white/60 text-xs transition cursor-pointer"
                                >
                                  Release
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB: CREDIT RULES */}
            {activeTab === 'credits' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Cost per unlock */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-white">Lead Unlock Cost</span>
                    </div>
                    <p className="text-xs text-white/50">
                      Amount of credits deducted from member balance when revealing direct contact coordinates. Set to 0 for free access.
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      {[0, 1, 2, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => {
                            updateAdminSettings({ costPerUnlock: val });
                            showNotice(`Cost per unlock set to ${val} credit${val === 1 ? '' : 's'}`);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                            adminSettings.costPerUnlock === val
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          {val === 0 ? 'Free (0)' : `${val} CR`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Registration bonus */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-white">Registration Bonus Credits</span>
                    </div>
                    <p className="text-xs text-white/50">
                      Credits automatically credited to new user accounts upon registration.
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      {[1, 3, 5, 10, 20].map((val) => (
                        <button
                          key={val}
                          onClick={() => {
                            updateAdminSettings({ registrationBonusCredits: val });
                            showNotice(`Registration bonus set to ${val} credits`);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                            adminSettings.registrationBonusCredits === val
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          +{val} CR
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB: DISPLAY & TOGGLES */}
            {activeTab === 'display' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                
                {/* Toggle: Google Business */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Star className="w-4 h-4 text-amber-400" />
                      <span>Google Business Profiles & Ratings</span>
                    </div>
                    <p className="text-xs text-white/50">
                      Show Google Business star ratings, review counts, and direct profile map links for prospects.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !adminSettings.showGoogleBusiness;
                      updateAdminSettings({ showGoogleBusiness: next });
                      showNotice(next ? 'Google Business info shown' : 'Google Business info hidden');
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition cursor-pointer ${
                      adminSettings.showGoogleBusiness ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {adminSettings.showGoogleBusiness ? 'Active' : 'Off'}
                  </button>
                </div>

                {/* Toggle: Social Media */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Share2 className="w-4 h-4 text-purple-400" />
                      <span>Social Media Channels</span>
                    </div>
                    <p className="text-xs text-white/50">
                      Display direct profile links for LinkedIn, Twitter/X, Instagram, Facebook, YouTube, and GitHub.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !adminSettings.showSocialMedia;
                      updateAdminSettings({ showSocialMedia: next });
                      showNotice(next ? 'Social media links enabled' : 'Social media links hidden');
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition cursor-pointer ${
                      adminSettings.showSocialMedia ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {adminSettings.showSocialMedia ? 'Active' : 'Off'}
                  </button>
                </div>

                {/* Toggle: Company Logos */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      <span>Company Logos & Brand Icons</span>
                    </div>
                    <p className="text-xs text-white/50">
                      Render brand logos and avatars on cards and detail dossiers with elegant gradient fallback.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !adminSettings.showCompanyLogos;
                      updateAdminSettings({ showCompanyLogos: next });
                      showNotice(next ? 'Company logos enabled' : 'Company logos hidden');
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition cursor-pointer ${
                      adminSettings.showCompanyLogos ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {adminSettings.showCompanyLogos ? 'Active' : 'Off'}
                  </button>
                </div>

                {/* Toggle: Private User Notes */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span>Private User-Specific CRM Notes</span>
                    </div>
                    <p className="text-xs text-white/50">
                      Allow each user to maintain private notes per lead that are only stored in their personal profile.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !adminSettings.allowUserPrivateNotes;
                      updateAdminSettings({ allowUserPrivateNotes: next });
                      showNotice(next ? 'Private notes space enabled' : 'Private notes space hidden');
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition cursor-pointer ${
                      adminSettings.allowUserPrivateNotes ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {adminSettings.allowUserPrivateNotes ? 'Active' : 'Off'}
                  </button>
                </div>

              </div>
            )}

            {/* TAB: TEAM & USER ACCOUNTS */}
            {activeTab === 'users' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-semibold text-white">Registered User Accounts</h3>
                  <p className="text-xs text-white/50">Manage permissions, roles, and balance allocations.</p>
                </div>

                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.03] text-white/40 uppercase tracking-widest text-[10px]">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Balance</th>
                        <th className="py-3 px-4">Activity</th>
                        <th className="py-3 px-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allUsers.map((u) => {
                        const notesCount = Object.keys(u.privateNotes || {}).length;
                        return (
                          <tr key={u.id} className="hover:bg-white/[0.02] transition">
                            <td className="py-3 px-4">
                              <div className="font-medium text-white flex items-center gap-2">
                                <span>{u.name}</span>
                                {u.id === currentUser?.id && (
                                  <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded font-mono">YOU</span>
                                )}
                              </div>
                              <div className="text-[11px] text-white/50 font-mono">{u.email}</div>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => {
                                  const newRole: UserRole = u.role === 'admin' ? 'user' : 'admin';
                                  changeUserRoleAdmin(u.id, newRole);
                                  showNotice(`Changed ${u.name}'s role to ${newRole === 'admin' ? 'Administrator' : 'Member'}`);
                                }}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer border ${
                                  u.role === 'admin'
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30'
                                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                }`}
                                title="Click to toggle Admin / Member role"
                              >
                                {u.role === 'admin' ? 'Admin ✦' : 'Member'}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-purple-400 text-sm">
                                {u.credits} CR
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-white/60">
                              <div>🔓 {u.unlockedLeadIds.length} unlocked</div>
                              <div>⭐ {(u.bookmarkedLeadIds || []).length} bookmarks • 📝 {notesCount} notes</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    updateUserCreditsAdmin(u.id, 10);
                                    showNotice(`Added +10 credits to ${u.name}`);
                                  }}
                                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-purple-300 rounded text-[11px] transition cursor-pointer font-mono"
                                  title="Add 10 credits"
                                >
                                  +10
                                </button>
                                <button
                                  onClick={() => {
                                    updateUserCreditsAdmin(u.id, 50);
                                    showNotice(`Added +50 credits to ${u.name}`);
                                  }}
                                  className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded text-[11px] transition cursor-pointer font-mono"
                                  title="Add 50 credits"
                                >
                                  +50
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: DATASET CONTROLS */}
            {activeTab === 'database' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Upload Action */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-white">Import Google Sheet / CSV</span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Upload a new lead sheet or append prospects with auto-detected columns for socials, Google Business, ratings, and countries.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenUpload();
                      }}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-lg shadow-purple-950/40"
                    >
                      Open Lead Sheet Importer
                    </button>
                  </div>

                  {/* Export Action */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-white">Export Complete Database</span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Download a full CSV export containing all {leads.length} leads with company logos, countries, Google Business URLs, and claim states.
                    </p>
                    <button
                      onClick={handleExportCsv}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer border border-white/10"
                    >
                      Download Leads CSV
                    </button>
                  </div>

                </div>

                {/* Reset Leads Database */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-red-300 font-semibold text-sm">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>Reset to Default Global Dataset</span>
                    </div>
                    <p className="text-xs text-white/50 max-w-xl">
                      Restore the database back to the default 18 verified multinational enterprise leads with enriched socials, Google Business profiles, and clear claims. User accounts and private notes will be preserved.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm('Reset leads database back to original 18 enterprise leads?')) {
                        handleResetAction();
                        showNotice('Dataset reset to original default leads');
                      }
                    }}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 cursor-pointer"
                  >
                    Reset Leads
                  </button>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 7: EMAIL ALERTS & REGISTRATION NOTIFICATIONS */}
            {/* ========================================================= */}
            {activeTab === 'emails' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                
                {/* Status Hero Card */}
                <div className="bg-gradient-to-r from-purple-950/40 via-white/[0.02] to-blue-950/30 border border-white/10 rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${emailConfig?.isConfigured ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-amber-400'}`} />
                        <span className="text-xs uppercase tracking-widest font-bold text-white/70">
                          {emailConfig?.isConfigured 
                            ? `Live Email Sending Active via ${emailConfig.provider.toUpperCase()}`
                            : 'Email Service: Simulated & Ready for Credentials'}
                        </span>
                      </div>
                      <h3 className="font-serif italic text-2xl text-white">
                        Automated User Registration & Admin Alerts
                      </h3>
                      <p className="text-xs text-white/60 max-w-2xl leading-relaxed">
                        Whenever a new member registers on NullReach, two automated emails are triggered:
                        (1) A personalized welcome email to the user with their free welcome credits, and 
                        (2) An instant alert to your administrator inbox notifying you of their sign-up.
                      </p>
                    </div>

                    <button
                      id="send-test-alert-btn"
                      onClick={handleSendTestAlert}
                      disabled={isSendingTestAlert}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-950/40"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{isSendingTestAlert ? 'Dispatching...' : 'Send Test Alert'}</span>
                    </button>
                  </div>

                  {testAlertResult && (
                    <div className="mt-4 p-3 rounded-xl bg-purple-900/30 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2 animate-in fade-in">
                      <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{testAlertResult}</span>
                    </div>
                  )}
                </div>

                {/* Configuration Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* What Info Is Needed */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                      <Info className="w-4 h-4" />
                      <span>Required Credentials & Information</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      To send real emails directly to users' inboxes (e.g. Gmail, Outlook) and your alert email, here is what is needed:
                    </p>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                        <div className="font-semibold text-white">1. Recommended Email Provider: Resend</div>
                        <div className="text-white/50 text-[11px]">
                          Sign up at <span className="text-purple-300 font-mono">resend.com</span> (free tier includes 3,000 emails/month). Copy your API key:
                        </div>
                        <code className="block p-1.5 rounded bg-black/40 text-purple-300 font-mono text-[10px]">
                          RESEND_API_KEY=re_123456789...
                        </code>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                        <div className="font-semibold text-white">2. Sender Email Address</div>
                        <div className="text-white/50 text-[11px]">
                          For instant testing, Resend allows using <span className="text-purple-300 font-mono">onboarding@resend.dev</span> without domain verification. For production, add your domain (e.g. <span className="text-purple-300 font-mono">alerts@usecodify.com</span>).
                        </div>
                        <code className="block p-1.5 rounded bg-black/40 text-purple-300 font-mono text-[10px]">
                          SENDER_EMAIL=NullReach &lt;onboarding@resend.dev&gt;
                        </code>
                      </div>

                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                        <div className="font-semibold text-white">3. Admin Notification Destination</div>
                        <div className="text-white/50 text-[11px]">
                          Where you want new sign-up alerts delivered:
                        </div>
                        <code className="block p-1.5 rounded bg-black/40 text-purple-300 font-mono text-[10px]">
                          ADMIN_ALERT_EMAIL={emailConfig?.adminAlertEmail || 'akashsuresh2403@gmail.com'}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Automated Flows Description */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                      <Check className="w-4 h-4" />
                      <span>Active Automation Flows</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        <div className="font-semibold text-white flex items-center justify-between">
                          <span>User Welcome Email</span>
                          <span className="text-[10px] text-emerald-400 font-mono">Automatic</span>
                        </div>
                        <p className="text-white/50 text-[11px] leading-relaxed">
                          Triggered immediately when someone completes the registration form. Confirms their account, details their 3 free welcome credits, and provides direct access to unlock executive leads.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        <div className="font-semibold text-white flex items-center justify-between">
                          <span>Admin Registration Alert</span>
                          <span className="text-[10px] text-purple-400 font-mono">To You</span>
                        </div>
                        <p className="text-white/50 text-[11px] leading-relaxed">
                          Dispatched directly to <strong className="text-white">{emailConfig?.adminAlertEmail || 'akashsuresh2403@gmail.com'}</strong> with the registrant's name, email, account role, credits granted, and registration timestamp.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                        <div className="font-semibold text-white">Alternative: SendGrid</div>
                        <p className="text-white/50 text-[11px] leading-relaxed">
                          If you already have a SendGrid account, you can supply <code className="text-purple-300 font-mono">SENDGRID_API_KEY</code> instead of Resend. The system will automatically detect and route through SendGrid.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
            <div className="text-[11px] text-white/40 font-mono">
              NullReach Intelligence Platform • Admin: {currentUser?.name}
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
            >
              Close Control Panel
            </button>
          </div>

        </div>
      </div>

      {/* Full Lead Dossier Inspector Modal */}
      {inspectedLead && (
        <AdminLeadDossierModal
          lead={inspectedLead}
          isOpen={!!inspectedLead}
          onClose={() => setInspectedLead(null)}
          onReleaseClaim={(id) => {
            onReleaseClaim(id);
            setInspectedLead(prev => prev && prev.id === id ? { ...prev, claimedByUserId: undefined, claimedByUserName: undefined, claimedAt: undefined } : prev);
            showNotice('Claim released successfully');
          }}
          allUsers={allUsers}
        />
      )}
    </>
  );
};
