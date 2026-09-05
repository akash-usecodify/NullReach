import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Globe, 
  Linkedin, 
  MapPin, 
  Building2, 
  DollarSign, 
  Users, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  Coins, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  Download,
  AlertCircle,
  Star,
  Share2,
  Globe2,
  Save,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lead } from '../types';
import { useAuth } from '../context/AuthContext';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenTopUp: () => void;
  onOpenAuth: () => void;
  onLeadClaimed?: (leadId: string) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onOpenTopUp,
  onOpenAuth,
  onLeadClaimed,
}) => {
  const { 
    currentUser, 
    isAuthenticated, 
    isAdmin,
    isLeadUnlocked, 
    unlockLead,
    isLeadBookmarked,
    toggleBookmarkLead,
    recordLeadView,
    adminSettings,
    getUserLeadNote,
    saveLeadUserNote,
  } = useAuth();

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Private note state for this specific user & lead
  const [userNote, setUserNote] = useState('');
  const [noteSavedNotice, setNoteSavedNotice] = useState(false);

  // Load private note when lead changes or opens
  useEffect(() => {
    if (lead?.id) {
      setUserNote(getUserLeadNote(lead.id));
    }
  }, [lead?.id, currentUser?.id]);

  // Automatically record this lead as viewed in user profile history and trigger exclusive claim if enabled
  useEffect(() => {
    if (isOpen && lead?.id) {
      recordLeadView(lead.id);
      if (adminSettings.exclusiveLeadViewing && onLeadClaimed) {
        onLeadClaimed(lead.id);
      }
    }
  }, [isOpen, lead?.id]);

  if (!isOpen || !lead) return null;

  const unlocked = isLeadUnlocked(lead.id);
  const bookmarked = isLeadBookmarked(lead.id);
  const cost = adminSettings.costPerUnlock;

  const isClaimedByMe = currentUser && lead.claimedByUserId === currentUser.id;
  const isClaimedByOther = lead.claimedByUserId && (!currentUser || lead.claimedByUserId !== currentUser.id);

  const handleCopy = (text: string, type: 'email' | 'phone' | 'all') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleSavePrivateNote = () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    saveLeadUserNote(lead.id, userNote);
    setNoteSavedNotice(true);
    setTimeout(() => setNoteSavedNotice(false), 2500);
  };

  const handleUnlock = () => {
    setErrorMsg(null);
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    const result = unlockLead(lead.id);
    if (result.success) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#3b82f6', '#10b981']
        });
      } catch {
        // ignore
      }
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleDownloadVCard = () => {
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${lead.name}`,
      `TITLE:${lead.title}`,
      `ORG:${lead.company}`,
      `EMAIL;TYPE=INTERNET,WORK:${lead.email}`,
      `TEL;TYPE=WORK,VOICE:${lead.phone}`,
      `ADR;TYPE=WORK:;;${lead.location};${lead.country || ''};;;`,
      lead.website ? `URL:${lead.website}` : '',
      lead.googleBusinessUrl ? `X-GMB:${lead.googleBusinessUrl}` : '',
      lead.notes ? `NOTE:${lead.notes}` : '',
      'END:VCARD'
    ].filter(Boolean).join('\n');

    const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${lead.name.replace(/\s+/g, '_')}_Lead.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Liquid glass backdrop */}
      <div 
        className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal dialog */}
      <div 
        id="lead-detail-modal"
        className="relative w-full max-w-2xl bg-[#0D0D10] rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 shadow-2xl border border-white/10 z-10 animate-in fade-in zoom-in-95 duration-200 text-white max-h-[92vh] overflow-y-auto"
      >
        {/* Top Right Controls: Bookmark & Close */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <button
            id={`modal-bookmark-btn-${lead.id}`}
            type="button"
            onClick={() => toggleBookmarkLead(lead.id)}
            className={`p-2 rounded-full transition-all duration-200 cursor-pointer ${
              bookmarked 
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm' 
                : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
            title={bookmarked ? "Favorited (Saved to profile)" : "Save to Favorites"}
          >
            <Star className={`w-4 h-4 ${bookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          <button
            id="close-lead-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-6 pr-20">
          {adminSettings.showCompanyLogos && lead.logoUrl ? (
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/15 p-1 shrink-0 shadow-md">
              <img 
                src={lead.logoUrl} 
                alt={`${lead.company} logo`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-serif text-2xl text-white shadow-xl shrink-0 border border-white/20">
              {lead.name.charAt(0)}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                {lead.category}
              </span>
              {lead.country && (
                <span className="text-[10px] text-white/70 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                  🌍 {lead.country}
                </span>
              )}
              {unlocked ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Unlocked</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  <Lock className="w-3 h-3" />
                  <span>{cost === 0 ? 'Free' : `${cost} Credit${cost > 1 ? 's' : ''}`}</span>
                </span>
              )}
            </div>
            <h2 className="font-serif italic text-2xl sm:text-3xl text-white tracking-tight truncate">
              {lead.name}
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              {lead.title} • <span className="text-white/90 font-medium">{lead.company}</span>
            </p>
          </div>
        </div>

        {/* Exclusivity Notice Banner if Active */}
        {adminSettings.exclusiveLeadViewing && (
          <div className="mb-6 p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-2.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-purple-200 leading-relaxed">
              {isClaimedByMe ? (
                <span><strong>Exclusive Viewing Active:</strong> You hold exclusive view rights to this lead. It is currently completely hidden from other users across the directory.</span>
              ) : isClaimedByOther && isAdmin ? (
                <span><strong>Admin Oversight Notice:</strong> This lead was exclusively claimed by <strong className="text-white">{lead.claimedByUserName || 'another user'}</strong> ({lead.claimedByUserId}). You can release this claim anytime in the Admin Control Panel.</span>
              ) : (
                <span><strong>Exclusive Viewing Enabled:</strong> This lead is now exclusively linked to your account session.</span>
              )}
            </div>
          </div>
        )}

        {/* Content Section: Either UNLOCKED or LOCKED VIEW */}
        {unlocked ? (
          <div className="space-y-6">
            
            {/* Direct Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Work Email Card */}
              <div className="p-4 rounded-[24px] bg-white/[0.03] border border-white/5 hover:border-purple-500/30 transition flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>Direct Work Email</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Verified Active
                  </span>
                </div>
                <p className="text-sm font-mono text-white select-all mb-3 truncate">
                  {lead.email}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(lead.email, 'email')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-white/80 transition cursor-pointer"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white/40" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center justify-center p-2 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition"
                    title="Send Email"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Direct Phone Card */}
              <div className="p-4 rounded-[24px] bg-white/[0.03] border border-white/5 hover:border-purple-500/30 transition flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    <Phone className="w-3.5 h-3.5 text-purple-400" />
                    <span>Direct Phone</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Direct Line
                  </span>
                </div>
                <p className="text-sm font-mono text-white select-all mb-3 truncate">
                  {lead.phone}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(lead.phone, 'phone')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-white/80 transition cursor-pointer"
                  >
                    {copiedPhone ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white/40" />
                        <span>Copy Phone</span>
                      </>
                    )}
                  </button>
                  <a
                    href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                    className="flex items-center justify-center p-2 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition"
                    title="Direct Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

            </div>

            {/* Google Business Profile & Ratings Section */}
            {adminSettings.showGoogleBusiness && (lead.googleBusinessUrl || lead.googleRating) && (
              <div className="p-4 rounded-[24px] bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                    <Globe2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Google Business Profile & Reviews</span>
                  </div>
                  {lead.googleRating && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{lead.googleRating}</span>
                      {lead.googleReviewsCount && (
                        <span className="text-amber-400/60 font-mono">({lead.googleReviewsCount} Google Reviews)</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="text-xs text-white/60">
                    Verified Google Maps & Business presence for <strong className="text-white">{lead.company}</strong> in {lead.location}.
                  </div>
                  {lead.googleBusinessUrl && (
                    <a
                      href={lead.googleBusinessUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-medium transition shrink-0"
                    >
                      <span>View Google Maps Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Social Media Channels Section */}
            {adminSettings.showSocialMedia && lead.socials && Object.values(lead.socials).some(Boolean) && (
              <div className="p-4 rounded-[24px] bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                  <Share2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Social Media & Executive Channels</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {lead.socials.linkedin && (
                    <a
                      href={lead.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/20 text-xs transition"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}

                  {lead.socials.twitter && (
                    <a
                      href={lead.socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs transition"
                    >
                      <span>𝕏 / Twitter</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}

                  {lead.socials.instagram && (
                    <a
                      href={lead.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/20 text-xs transition"
                    >
                      <span>Instagram</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}

                  {lead.socials.facebook && (
                    <a
                      href={lead.socials.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-xs transition"
                    >
                      <span>Facebook</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}

                  {lead.socials.youtube && (
                    <a
                      href={lead.socials.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs transition"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}

                  {lead.socials.github && (
                    <a
                      href={lead.socials.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs transition"
                    >
                      <span>GitHub</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Company Intel & Web Presence */}
            <div className="p-5 rounded-[24px] bg-white/[0.02] border border-white/5 space-y-3">
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">
                Company Details & Digital Footprint
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {lead.revenue && (
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase tracking-wider">Est. Revenue</span>
                    <span className="font-semibold text-white">{lead.revenue}</span>
                  </div>
                )}
                {lead.employees && (
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase tracking-wider">Team Size</span>
                    <span className="font-semibold text-white">{lead.employees}</span>
                  </div>
                )}
                {lead.website && (
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase tracking-wider">Website</span>
                    <a 
                      href={lead.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-purple-400 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {lead.location && (
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase tracking-wider">Location</span>
                    <span className="text-white/80">{lead.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lead Sourcing Notes */}
            {lead.notes && (
              <div className="p-5 rounded-[24px] bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>Lead Intelligence & Sourcing Notes</span>
                </div>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  {lead.notes}
                </p>
              </div>
            )}

            {/* USER-SPECIFIC PRIVATE CRM NOTES */}
            {adminSettings.allowUserPrivateNotes && (
              <div className="p-5 rounded-[24px] bg-purple-950/20 border border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-purple-300 uppercase tracking-[0.2em]">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    <span>Your Private Notes (Saved Only to Your Account)</span>
                  </div>
                  {noteSavedNotice && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-in fade-in flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Note Saved!</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/50">
                  Record call logs, custom deal values, follow-up dates, or negotiation details. These notes are completely private to <strong className="text-white">{currentUser?.name || 'you'}</strong> and never shared with other users.
                </p>

                <textarea
                  id={`private-note-textarea-${lead.id}`}
                  rows={3}
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="e.g. Called on Tuesday, Elena interested in GPU orchestration audit. Follow up on 15th..."
                  className="w-full bg-black/40 border border-white/10 focus:border-purple-500 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:outline-none transition resize-none"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSavePrivateNote}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition cursor-pointer shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Note to My Profile</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadVCard}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs uppercase tracking-wider font-semibold text-white/80 bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Download .VCF</span>
                </button>
                <button
                  onClick={() => handleCopy(`${lead.name}\n${lead.title} at ${lead.company}\nEmail: ${lead.email}\nPhone: ${lead.phone}\nLocation: ${lead.location}\nCountry: ${lead.country || ''}`, 'all')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs uppercase tracking-wider font-semibold text-white/80 bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
                  <span>{copiedAll ? 'Intel Copied!' : 'Copy Summary'}</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2 rounded-full text-xs uppercase tracking-widest font-bold text-white bg-white/10 hover:bg-white/15 transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        ) : (
          /* LOCKED VIEW - PROMPT UNLOCK */
          <div className="space-y-6">
            
            {/* Liquid Locked Banner */}
            <div className="p-6 sm:p-8 rounded-[28px] bg-white/[0.02] border border-white/5 text-center relative overflow-hidden">
              <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-purple-400">
                <Lock className="w-6 h-6" />
              </div>

              <h3 className="font-serif italic text-2xl text-white mb-2">
                Unlock Complete Contact & Executive Intel
              </h3>
              <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto leading-relaxed mb-6">
                Reveal unmasked direct email address, direct telephone line, Google Business profile, social channels, and private notes space.
              </p>

              {/* What will be revealed checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto text-left mb-6">
                <div className="flex items-center gap-2 text-xs text-white/80 bg-white/[0.03] px-3.5 py-2.5 rounded-full border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Direct Work Email</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/80 bg-white/[0.03] px-3.5 py-2.5 rounded-full border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Direct Mobile / Phone</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/80 bg-white/[0.03] px-3.5 py-2.5 rounded-full border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Google Business & Ratings</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/80 bg-white/[0.03] px-3.5 py-2.5 rounded-full border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Private CRM Notes Space</span>
                </div>
              </div>

              {/* Credit Status Box */}
              {isAuthenticated && currentUser ? (
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Coins className="w-3.5 h-3.5 text-purple-400" />
                    <span>Cost: <strong className="text-white">{cost === 0 ? 'Free (0 Credits)' : `${cost} Credit${cost > 1 ? 's' : ''}`}</strong></span>
                  </div>
                  <span className="w-1 h-3 bg-white/20 rounded" />
                  <div className="text-xs text-white/50">
                    <span>Your Balance: <strong className={currentUser.credits >= cost ? "text-purple-400" : "text-rose-400"}>{currentUser.credits} Credits</strong></span>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Create an account to get <strong>{adminSettings.registrationBonusCredits} FREE Credits</strong> immediately!</span>
                </div>
              )}

              {errorMsg && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-rose-400 bg-rose-500/10 py-2 px-3 rounded-full border border-rose-500/20 max-w-md mx-auto">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Unlock Call-To-Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {!isAuthenticated ? (
                <button
                  id="modal-login-to-unlock-btn"
                  onClick={onOpenAuth}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-purple-600 hover:bg-purple-500 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Sign Up / Log In ({adminSettings.registrationBonusCredits} Free Credits)</span>
                </button>
              ) : currentUser.credits >= cost || cost === 0 ? (
                <button
                  id="confirm-unlock-lead-btn"
                  onClick={handleUnlock}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-purple-600 hover:bg-purple-500 transition shadow-xl shadow-purple-950/40 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Coins className="w-4 h-4 text-purple-300 group-hover:scale-110 transition-transform" />
                  <span>
                    {cost === 0 
                      ? 'Reveal Details (Free)' 
                      : `Unlock Full Lead (Spend ${cost} Credit${cost > 1 ? 's' : ''})`}
                  </span>
                </button>
              ) : (
                <button
                  id="modal-out-of-credits-topup-btn"
                  onClick={() => {
                    onClose();
                    onOpenTopUp();
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-purple-600 hover:bg-purple-500 transition shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Coins className="w-4 h-4 text-purple-300" />
                  <span>Top Up Credits (10 Credits for $2 USD)</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
