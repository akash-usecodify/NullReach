import React from 'react';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Lock, 
  CheckCircle2, 
  ArrowUpRight, 
  Coins, 
  Sparkles, 
  DollarSign, 
  Star,
  Globe,
  Share2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Lead } from '../types';
import { useAuth } from '../context/AuthContext';

interface LeadCardProps {
  lead: Lead;
  isUnlocked: boolean;
  onOpenLead: (lead: Lead) => void;
  onQuickUnlock: (lead: Lead, e: React.MouseEvent) => void;
}

// Helper to mask an email: e.g. "elena.rostova@neuralflow.io" -> "e•••••••@neuralflow.io"
function maskEmail(email: string): string {
  if (!email) return '••••••••@company.com';
  const parts = email.split('@');
  if (parts.length !== 2) return '••••••••';
  const user = parts[0];
  const domain = parts[1];
  const visibleChar = user.charAt(0);
  return `${visibleChar}••••••@${domain}`;
}

// Helper to mask phone: e.g. "+1 (415) 890-2134" -> "+1 (415) •••-••••"
function maskPhone(phone: string): string {
  if (!phone) return '+1 (•••) •••-••••';
  if (phone.includes('(') && phone.includes(')')) {
    const area = phone.split(')')[0] + ')';
    return `${area} •••-••••`;
  }
  return phone.slice(0, 5) + ' ••• ••••';
}

// Generate consistent gradient colors based on company name
function getAvatarGradient(name: string): string {
  const gradients = [
    'from-cyan-500 to-blue-600',
    'from-blue-500 to-indigo-600',
    'from-indigo-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-teal-500 to-cyan-600',
    'from-violet-500 to-fuchsia-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  isUnlocked,
  onOpenLead,
  onQuickUnlock,
}) => {
  const { isLeadBookmarked, toggleBookmarkLead, adminSettings, currentUser, isAdmin } = useAuth();
  const bookmarked = isLeadBookmarked(lead.id);

  const avatarGradient = getAvatarGradient(lead.company);
  const initials = lead.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const cost = adminSettings.costPerUnlock;
  const isClaimedByMe = currentUser && lead.claimedByUserId === currentUser.id;
  const isClaimed = !!lead.claimedByUserId;

  return (
    <div 
      id={`lead-card-${lead.id}`}
      onClick={() => onOpenLead(lead)}
      className={`group relative rounded-[36px] p-7 cursor-pointer flex flex-col justify-between transition-all duration-300 overflow-hidden ${
        isUnlocked 
          ? 'bg-white/[0.06] border border-white/15 shadow-2xl hover:border-purple-500/40 hover:bg-white/[0.08]' 
          : 'bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.06] shadow-xl hover:shadow-2xl'
      }`}
    >
      {/* Subtle hover gradient bloom in corner */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />

      <div>
        {/* Top meta, favorite star & badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs uppercase tracking-widest font-medium text-purple-400">
              {lead.title || 'Executive'}
            </span>
            {isClaimed && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-semibold">
                {isClaimedByMe ? 'YOUR EXCLUSIVE LEAD' : 'LOCKED'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id={`bookmark-lead-btn-${lead.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmarkLead(lead.id);
              }}
              className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                bookmarked 
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm' 
                  : 'bg-white/5 text-white/30 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
              title={bookmarked ? "Favorited (Saved to profile)" : "Save to Favorites"}
            >
              <Star className={`w-3.5 h-3.5 ${bookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            {isUnlocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Unlocked</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/50 border border-white/10 shrink-0 group-hover:text-purple-300 group-hover:border-purple-500/30 transition-colors">
                <Lock className="w-3 h-3 text-white/40 group-hover:text-purple-400" />
                <span>{cost === 0 ? 'Free' : `${cost} Credit${cost > 1 ? 's' : ''}`}</span>
              </span>
            )}
          </div>
        </div>

        {/* Name and Company Header with Logo */}
        <div className="flex items-start gap-3.5 mb-4">
          {adminSettings.showCompanyLogos && lead.logoUrl ? (
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-white/15 p-1 shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md">
              <img 
                src={lead.logoUrl} 
                alt={`${lead.company} logo`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  // fallback to initials if image link breaks
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center font-serif text-white text-base shadow-lg shrink-0 border border-white/15 group-hover:scale-105 transition-transform duration-300`}>
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-serif italic text-white group-hover:text-purple-300 transition-colors truncate tracking-tight mb-0.5">
              {lead.name}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-white/60 truncate">
              <span className="truncate font-medium text-white/80">{lead.company}</span>
              {lead.country && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="text-white/60 text-xs shrink-0">{lead.country}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Category, Location & Google Rating Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-white/60 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            {lead.category}
          </span>

          {lead.location && (
            <span className="text-[10px] text-white/50 bg-white/[0.02] px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-purple-400" />
              <span>{lead.location}</span>
            </span>
          )}

          {adminSettings.showGoogleBusiness && (lead.googleRating || lead.googleBusinessUrl) && (
            <span className="text-[10px] font-medium text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{lead.googleRating || '4.8'}</span>
              {lead.googleReviewsCount && (
                <span className="text-amber-400/60 font-mono">({lead.googleReviewsCount})</span>
              )}
            </span>
          )}

          {lead.revenue && (
            <span className="text-[10px] uppercase tracking-wider text-purple-300/80 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              Rev: {lead.revenue}
            </span>
          )}
        </div>

        {/* Social channels preview if enabled */}
        {adminSettings.showSocialMedia && lead.socials && Object.values(lead.socials).some(Boolean) && (
          <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/50">
            <span className="text-[10px] uppercase tracking-widest text-white/30">Socials:</span>
            <div className="flex items-center gap-2">
              {lead.socials.linkedin && (
                <span className="text-purple-300 hover:text-white font-mono">LinkedIn</span>
              )}
              {lead.socials.twitter && (
                <span className="text-purple-300 hover:text-white font-mono">X/Twitter</span>
              )}
              {lead.socials.instagram && (
                <span className="text-purple-300 hover:text-white font-mono">Instagram</span>
              )}
              {lead.socials.github && (
                <span className="text-purple-300 hover:text-white font-mono">GitHub</span>
              )}
            </div>
          </div>
        )}

        {/* Contact info container with Artistic Flair styling */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-5 space-y-2.5">
          {/* Email row */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[10px] uppercase tracking-widest text-white/30 shrink-0">Email</span>
            <span className={`font-mono text-xs truncate ${isUnlocked ? 'text-white/90 font-medium' : 'blur-sm select-none text-white/40'}`}>
              {isUnlocked ? lead.email : maskEmail(lead.email)}
            </span>
          </div>

          {/* Direct Phone row */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[10px] uppercase tracking-widest text-white/30 shrink-0">Direct</span>
            <span className={`font-mono text-xs truncate ${isUnlocked ? 'text-white/90 font-medium' : 'blur-sm select-none text-white/40'}`}>
              {isUnlocked ? lead.phone : maskPhone(lead.phone)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button Section with Artistic Divider */}
      <div className="mt-auto">
        <div className="h-[1px] w-full bg-white/10 mb-4" />
        {isUnlocked ? (
          <button
            id={`view-unlocked-btn-${lead.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenLead(lead);
            }}
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View Full Intel & Dossier</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            id={`unlock-lead-btn-${lead.id}`}
            onClick={(e) => onQuickUnlock(lead, e)}
            className="w-full py-3 px-4 bg-white hover:bg-white/90 text-black rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 text-black" />
            <span>
              {cost === 0 ? 'Reveal Details (Free)' : `Unlock Lead (${cost} Credit${cost > 1 ? 's' : ''})`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
