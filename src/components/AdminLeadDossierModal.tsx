import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Globe2, 
  Mail, 
  Phone, 
  Star, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Share2, 
  MapPin, 
  Calendar, 
  Check, 
  Copy, 
  Code, 
  FileText, 
  User as UserIcon,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';
import { Lead, User } from '../types';

interface AdminLeadDossierModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onReleaseClaim: (leadId: string) => void;
  allUsers: User[];
}

export const AdminLeadDossierModal: React.FC<AdminLeadDossierModalProps> = ({
  lead,
  isOpen,
  onClose,
  onReleaseClaim,
  allUsers,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'exclusivity' | 'raw'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const claimedUser = lead.claimedByUserId 
    ? allUsers.find(u => u.id === lead.claimedByUserId) 
    : null;

  const usersWhoUnlocked = allUsers.filter(u => 
    (u.unlockedLeadIds || []).includes(lead.id)
  );

  const usersWhoBookmarked = allUsers.filter(u => 
    (u.bookmarkedLeadIds || []).includes(lead.id)
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Card */}
      <div 
        id={`admin-dossier-${lead.id}`}
        className="relative w-full max-w-3xl bg-[#0D0D10] rounded-[28px] sm:rounded-[32px] shadow-2xl border border-purple-500/30 z-10 text-white overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Profile Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-950/30 via-transparent to-transparent flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-4">
            {lead.logoUrl ? (
              <img 
                src={lead.logoUrl} 
                alt={lead.company}
                className="w-14 h-14 rounded-2xl object-cover border border-white/15 bg-white/5 shrink-0 shadow-lg"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-xl font-serif italic text-white shadow-lg shrink-0 border border-white/10">
                {lead.company.charAt(0)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                  {lead.category}
                </span>
                {lead.country && (
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-white/10 text-white/80 px-2 py-0.5 rounded-full">
                    📍 {lead.country}
                  </span>
                )}
                {lead.claimedByUserId ? (
                  <span className="text-[10px] font-mono tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Claimed Exclusive</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    <span>Unclaimed</span>
                  </span>
                )}
              </div>

              <h2 className="font-serif italic text-2xl text-white mt-1">
                {lead.name}
              </h2>
              <p className="text-xs text-purple-300/90 font-medium">
                {lead.title} • <span className="text-white font-semibold">{lead.company}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/10 bg-white/[0.01] shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 border-b-2 font-medium tracking-wide transition ${
              activeTab === 'overview' 
                ? 'border-purple-500 text-purple-300 bg-purple-500/10 rounded-t-lg' 
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Full Dossier
          </button>
          <button
            onClick={() => setActiveTab('exclusivity')}
            className={`px-4 py-2 border-b-2 font-medium tracking-wide transition flex items-center gap-1.5 ${
              activeTab === 'exclusivity' 
                ? 'border-purple-500 text-purple-300 bg-purple-500/10 rounded-t-lg' 
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Exclusivity & Isolation</span>
            {lead.claimedByUserId && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-2 border-b-2 font-medium tracking-wide transition flex items-center gap-1.5 ${
              activeTab === 'raw' 
                ? 'border-purple-500 text-purple-300 bg-purple-500/10 rounded-t-lg' 
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw Sheet Record</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Contact Information Cards */}
              <div>
                <h3 className="text-[11px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span>Direct Contact Coordinates</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Direct Email</div>
                      <div className="font-mono text-white text-xs mt-0.5">{lead.email}</div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(lead.email, 'email')}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                      title="Copy Email"
                    >
                      {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Phone */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Direct Phone</div>
                      <div className="font-mono text-white text-xs mt-0.5">{lead.phone}</div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(lead.phone, 'phone')}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                      title="Copy Phone"
                    >
                      {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Location & Country */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Location & Country</div>
                    <div className="text-white text-xs mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-400" />
                      <span>{lead.location} {lead.country ? `(${lead.country})` : ''}</span>
                    </div>
                  </div>

                  {/* Website */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Corporate Website</div>
                      <div className="text-purple-300 text-xs mt-0.5 font-mono truncate max-w-[200px]">
                        {lead.website || 'N/A'}
                      </div>
                    </div>
                    {lead.website && (
                      <a 
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 hover:text-white transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Google Business & Metrics */}
              <div>
                <h3 className="text-[11px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Business Profile & Intelligence</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Google Rating</div>
                    <div className="flex items-center gap-1.5 text-white font-bold text-sm mt-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{lead.googleRating || '4.8'} / 5.0</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Verified Reviews</div>
                    <div className="text-white font-bold text-sm mt-1 font-mono">
                      {lead.googleReviewsCount || 120} Reviews
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">Revenue / Scale</div>
                    <div className="text-purple-300 font-bold text-sm mt-1">
                      {lead.revenue || 'Undisclosed'}
                    </div>
                  </div>
                </div>

                {lead.googleBusinessUrl && (
                  <div className="mt-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/70">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span className="truncate max-w-md font-mono text-[11px]">{lead.googleBusinessUrl}</span>
                    </div>
                    <a 
                      href={lead.googleBusinessUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-purple-300 hover:text-white flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <span>Open Maps Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Social Channels */}
              <div>
                <h3 className="text-[11px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Executive & Brand Social Channels</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'github'].map((platform) => {
                    const url = lead.socials?.[platform as keyof typeof lead.socials] || (platform === 'linkedin' ? lead.linkedin : undefined);
                    return (
                      <div 
                        key={platform}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          url 
                            ? 'bg-white/[0.04] border-white/10 text-white' 
                            : 'bg-white/[0.01] border-white/5 text-white/30'
                        }`}
                      >
                        <span className="capitalize font-medium text-[11px]">{platform}</span>
                        {url ? (
                          <a 
                            href={url.startsWith('http') ? url : `https://${url}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="text-purple-400 hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-white/20">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                  <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">
                    Public Sheet Prospect Notes
                  </div>
                  <p className="text-white/80 leading-relaxed text-xs">{lead.notes}</p>
                </div>
              )}

              {/* Batch Origin */}
              <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider">
                      Upload Batch Origin
                    </div>
                    <div className="text-white font-medium text-xs">
                      {lead.batchName || 'Executive Lead Database'}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-white/40 font-mono">
                  {lead.uploadedAt ? new Date(lead.uploadedAt).toLocaleString() : 'System Default'}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: EXCLUSIVITY & ISOLATION */}
          {activeTab === 'exclusivity' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-white">Isolation Status</span>
                  </div>
                  {lead.claimedByUserId ? (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-mono text-[10px] font-bold">
                      EXCLUSIVE CLAIM ACTIVE
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-mono text-[10px] font-bold">
                      PUBLIC / UNCLAIMED
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/60 leading-relaxed">
                  When a user opens a lead, NullReach immediately claims that lead for them. With Exclusive Lead Viewing active, this lead is completely hidden from other users in their search results and category views.
                </p>

                {lead.claimedByUserId ? (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-[10px] text-white/40 uppercase">Claimed By Member</div>
                        <div className="font-semibold text-white mt-0.5">{lead.claimedByUserName || 'Unknown User'}</div>
                        <div className="text-[11px] font-mono text-white/50">{claimedUser?.email || lead.claimedByUserId}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase">Claim Timestamp</div>
                        <div className="font-mono text-white mt-0.5">
                          {lead.claimedAt ? new Date(lead.claimedAt).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end">
                      <button
                        onClick={() => {
                          onReleaseClaim(lead.id);
                          onClose();
                        }}
                        className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        Release Claim (Make Public Again)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
                    This lead is currently available in the public directory. The next registered user to click and view its profile will claim exclusive access.
                  </div>
                )}
              </div>

              {/* Historical User Interactions */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-purple-400" />
                  <span>Member Interactions Audit</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-white/40 text-[10px] uppercase">Unlocked By Members ({usersWhoUnlocked.length})</div>
                    {usersWhoUnlocked.length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {usersWhoUnlocked.map(u => (
                          <li key={u.id} className="text-white font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{u.name}</span>
                            <span className="text-[10px] text-white/40 font-mono">({u.email})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-white/30 italic mt-1">No unlocks yet</div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-white/40 text-[10px] uppercase">Bookmarked By Members ({usersWhoBookmarked.length})</div>
                    {usersWhoBookmarked.length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {usersWhoBookmarked.map(u => (
                          <li key={u.id} className="text-white font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>{u.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-white/30 italic mt-1">No bookmarks yet</div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: RAW RECORD */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/50 uppercase font-mono tracking-wider">
                  Raw Lead JSON Attributes
                </span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(lead, null, 2), 'raw_json')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition cursor-pointer"
                >
                  {copiedField === 'raw_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy JSON</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-[#0A0A0C] border border-white/10 text-purple-300 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-[350px]">
                {JSON.stringify(lead, null, 2)}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-white/40">ID: {lead.id}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
};
