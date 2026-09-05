import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  Coins, 
  CheckCircle2, 
  Zap, 
  Users, 
  Building2, 
  Star, 
  CreditCard, 
  Globe, 
  LogIn, 
  UserPlus, 
  LogOut,
  ChevronRight, 
  Info,
  Award,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { Lead } from '../types';
import { useAuth } from '../context/AuthContext';
import { CREDIT_UNIT_PRICE_USD, MAX_TOP_UP_CREDITS, MIN_TOP_UP_CREDITS } from '../data/pricingPlans';

interface LandingPageProps {
  leads: Lead[];
  onOpenAuth: (mode: 'login' | 'register') => void;
  onEnterPortal: () => void;
  onOpenTopUp: (credits?: number) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  leads,
  onOpenAuth,
  onEnterPortal,
  onOpenTopUp
}) => {
  const { currentUser, allUsers, switchUser, adminSettings, logout } = useAuth();
  
  // Interactive credit calculator state (default 10 credits)
  const [calcCredits, setCalcCredits] = useState<number>(10);

  // Embedded login / register tab state
  const [authTab, setAuthTab] = useState<'login' | 'register'>('register');
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [inputName, setInputName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();

  const handleEmbeddedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (authTab === 'login') {
        const res = await login(inputEmail, inputPassword);
        if (!res.success) {
          setAuthError(res.message);
        } else {
          onEnterPortal();
        }
      } else {
        const res = await register(inputEmail, inputName, inputPassword);
        if (!res.success) {
          setAuthError(res.message);
        } else {
          onEnterPortal();
        }
      }
    } catch {
      setAuthError('An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calcTotalUsd = (calcCredits * CREDIT_UNIT_PRICE_USD).toFixed(2);
  const teaserLeads = leads.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0D0D0F]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 flex items-center justify-center font-serif italic text-xl font-bold text-white shadow-lg shadow-purple-950/50 border border-white/20">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif italic text-2xl font-bold tracking-tight text-white">NullReach</span>
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  v2.1 Enterprise
                </span>
              </div>
              <p className="text-[10px] text-white/50 tracking-wider uppercase font-medium">Executive Lead Intelligence</p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-white/60">
            <a href="#features" className="hover:text-white transition">Platform</a>
            <a href="#database-preview" className="hover:text-white transition">Live Directory</a>
            <a href="#pricing-calculator" className="hover:text-white transition">Pricing ($0.99/cr)</a>
            <a href="#stripe-payment" className="hover:text-white transition">Stripe Checkout</a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white/60">Signed in as</span>
                  <strong className="text-white font-medium">{currentUser.name}</strong>
                  <span className="text-purple-300 font-mono font-bold">({currentUser.credits} Cr)</span>
                </div>
                <button
                  id="nav-enter-portal-btn"
                  onClick={onEnterPortal}
                  className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-950/50 flex items-center gap-2 cursor-pointer"
                >
                  <span>Launch My Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="nav-logout-btn"
                  onClick={logout}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
                  title="Sign out of account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  id="nav-sign-in-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  id="nav-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="px-4 sm:px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-950/40 flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Get 3 Free Credits</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-white/10">
        
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Hero Messaging (Col 7) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[11px] font-bold uppercase tracking-widest text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>3 Free Welcome Credits • 1 Credit = $0.99 USD</span>
              </div>

              <h1 className="font-serif italic text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.15]">
                Verified Executive Leads. <br />
                <span className="bg-gradient-to-r from-purple-300 via-white to-purple-400 bg-clip-text text-transparent not-italic font-sans font-extrabold tracking-normal">
                  Exclusive Pipeline Locking.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Direct phone coordinates, verified corporate emails, and Google Business intelligence for decision-makers. When you view or claim a lead, NullReach locks it exclusively to you so competing teams can’t burn it out.
              </p>

              {/* Badges / Guarantees */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 max-w-xl mx-auto lg:mx-0 text-left">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Start Free</div>
                  <div className="font-serif italic font-bold text-lg text-purple-300">3 Free Credits</div>
                  <div className="text-[11px] text-white/50">Instant on signup</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Unit Pricing</div>
                  <div className="font-serif italic font-bold text-lg text-white">$0.99 / Credit</div>
                  <div className="text-[11px] text-white/50">1 credit = 1 contact</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Top-Up Range</div>
                  <div className="font-serif italic font-bold text-lg text-emerald-400">1 to 50 Credits</div>
                  <div className="text-[11px] text-white/50">Stripe encrypted</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 justify-center lg:justify-start">
                {currentUser ? (
                  <button
                    id="hero-launch-portal-btn"
                    onClick={onEnterPortal}
                    className="w-full sm:w-auto px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest bg-purple-600 hover:bg-purple-500 text-white transition shadow-xl shadow-purple-950/60 flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <span>Enter My Portal ({currentUser.credits} Credits Available)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      id="hero-register-btn"
                      onClick={() => onOpenAuth('register')}
                      className="w-full sm:w-auto px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest bg-purple-600 hover:bg-purple-500 text-white transition shadow-xl shadow-purple-950/60 flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account & Claim 3 Credits</span>
                    </button>

                    <button
                      id="hero-sign-in-btn"
                      onClick={() => onOpenAuth('login')}
                      className="w-full sm:w-auto px-6 py-4 rounded-full text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/15 text-white transition border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Portal</span>
                    </button>
                  </>
                )}
              </div>

              {/* Fast Persona Switcher / Demo Helper for Admin & Evaluator */}
              <div className="pt-4 border-t border-white/10 text-xs text-white/50">
                <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start">
                  <span className="font-semibold text-white/60">Quick Sign In:</span>
                  {allUsers.slice(0, 3).map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        onEnterPortal();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-purple-300 font-mono transition cursor-pointer"
                    >
                      {u.name} ({u.role === 'admin' ? 'Admin' : `${u.credits} Cr`})
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Hero Interactive Authentication Card (Col 5) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-[32px] bg-[#0D0D0F] border border-white/15 p-6 sm:p-8 shadow-2xl shadow-purple-950/30">
                
                {currentUser ? (
                  /* Logged-In User Card */
                  <div className="text-center py-6 space-y-5">
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center mx-auto text-2xl font-serif italic">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1 flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Session Active
                      </div>
                      <h3 className="font-serif italic text-2xl text-white">Welcome back, {currentUser.name}!</h3>
                      <p className="text-xs text-white/60 mt-1">{currentUser.email} • {currentUser.role === 'admin' ? 'Administrator' : 'Verified Member'}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-around text-center">
                      <div>
                        <div className="text-[10px] uppercase text-white/40">Balance</div>
                        <div className="font-mono font-bold text-xl text-purple-300">{currentUser.credits} Cr</div>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div>
                        <div className="text-[10px] uppercase text-white/40">Unlocked</div>
                        <div className="font-mono font-bold text-xl text-white">{currentUser.unlockedLeadIds.length} Leads</div>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div>
                        <div className="text-[10px] uppercase text-white/40">Rate</div>
                        <div className="font-mono font-bold text-sm text-emerald-400">$0.99 / cr</div>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <button
                        onClick={onEnterPortal}
                        className="w-full py-3.5 px-6 rounded-full text-xs font-bold uppercase tracking-widest bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Open Lead Directory Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        onClick={onOpenTopUp}
                        className="w-full py-3 px-6 rounded-full text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Coins className="w-4 h-4 text-purple-400" />
                        <span>Top Up Credits via Stripe</span>
                      </button>

                      <button
                        id="hero-user-card-logout-btn"
                        onClick={logout}
                        className="w-full py-2.5 px-6 rounded-full text-xs font-semibold text-rose-300/80 hover:text-rose-200 hover:bg-rose-500/10 transition border border-rose-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of {currentUser.name}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Embedded Sign In / Register Card */
                  <form onSubmit={handleEmbeddedSubmit} className="space-y-4">
                    
                    {/* Mode Tabs */}
                    <div className="flex p-1 rounded-full bg-white/5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('register');
                          setAuthError(null);
                        }}
                        className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                          authTab === 'register'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-white/50 hover:text-white'
                        }`}
                      >
                        Create Account (+3)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('login');
                          setAuthError(null);
                        }}
                        className={`flex-1 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                          authTab === 'login'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-white/50 hover:text-white'
                        }`}
                      >
                        Sign In
                      </button>
                    </div>

                    <div className="text-center pt-1">
                      <h3 className="font-serif italic text-2xl text-white">
                        {authTab === 'register' ? 'Join NullReach Platform' : 'Sign In to Your Account'}
                      </h3>
                      <p className="text-xs text-white/60 mt-1">
                        {authTab === 'register' 
                          ? `Sign up now and receive ${adminSettings.registrationBonusCredits} free lead reveal credits.` 
                          : 'Enter your credentials to access your executive directory and claims.'}
                      </p>
                    </div>

                    {authError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

                    {authTab === 'register' && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={inputName}
                          onChange={(e) => setInputName(e.target.value)}
                          placeholder="e.g. Akash Suresh"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs sm:text-sm focus:border-purple-400 outline-none transition"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                        Corporate Email
                      </label>
                      <input
                        type="email"
                        required
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs sm:text-sm focus:border-purple-400 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs sm:text-sm focus:border-purple-400 outline-none transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-full text-xs font-bold uppercase tracking-widest bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 cursor-pointer pt-3"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{authTab === 'register' ? 'Register & Get 3 Free Credits' : 'Sign In & Access Portal'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1 text-[11px] text-white/40">
                      Protected by 256-bit encryption • No credit card required for free tier
                    </div>

                  </form>
                )}

              </div>
            </div>

          </div>

        </div>

      </section>

      {/* LIVE DATABASE DIRECTORY TEASER PREVIEW */}
      <section id="database-preview" className="py-20 border-b border-white/10 bg-[#0D0D0F]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-bold uppercase tracking-widest text-purple-300 mb-2">
                <Database className="w-3.5 h-3.5" />
                <span>Sample Directory Preview</span>
              </div>
              <h2 className="font-serif italic text-3xl sm:text-4xl text-white">
                Inside the NullReach Prospect Directory
              </h2>
              <p className="text-sm text-white/60 mt-1 max-w-xl">
                Explore decision-makers across technology, enterprise SaaS, and healthtech. Log in or create a free account to reveal direct verified phone numbers and corporate emails.
              </p>
            </div>

            <button
              onClick={() => currentUser ? onEnterPortal() : onOpenAuth('register')}
              className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer self-start md:self-auto"
            >
              <span>{currentUser ? 'Open Full Directory' : 'Register to Unlock All Leads'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Lead Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teaserLeads.map((lead) => (
              <div 
                key={lead.id}
                className="rounded-[28px] bg-[#0D0D0F] border border-white/10 p-6 flex flex-col justify-between hover:border-purple-500/40 transition group"
              >
                <div>
                  {/* Lead Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-900/60 to-indigo-900/60 border border-white/10 flex items-center justify-center font-serif italic text-lg font-bold text-white">
                      {lead.name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider bg-white/5 text-white/70 px-2.5 py-1 rounded-full border border-white/5">
                      {lead.country}
                    </span>
                  </div>

                  <h3 className="font-serif italic text-xl text-white group-hover:text-purple-300 transition">
                    {lead.name}
                  </h3>
                  <p className="text-xs font-medium text-white/60 mb-2">{lead.role}</p>

                  <div className="flex items-center gap-1.5 text-xs text-white/80 mb-4">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-semibold">{lead.company}</span>
                  </div>

                  {/* Rating / Meta */}
                  {lead.googleRating && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-4 bg-amber-500/10 px-2.5 py-1 rounded-full w-fit">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="font-bold">{lead.googleRating}</span>
                      <span className="text-white/40">({lead.googleReviews} reviews)</span>
                    </div>
                  )}

                  {/* Blurred Coordinates Preview */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 mb-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/40">Direct Email:</span>
                      <span className="font-mono text-purple-300 blur-[4px] select-none">
                        executive.revealed@domain.com
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/40">Direct Phone:</span>
                      <span className="font-mono text-emerald-400 blur-[4px] select-none">
                        +1 (555) 382-9920
                      </span>
                    </div>
                  </div>
                </div>

                {/* Unlock CTA button */}
                <button
                  onClick={() => currentUser ? onEnterPortal() : onOpenAuth('register')}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{currentUser ? 'Reveal in Portal' : 'Register to Reveal (1 Cr)'}</span>
                </button>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* PRICING & STRIPE PAYMENT CALCULATOR SECTION */}
      <section id="pricing-calculator" className="py-20 border-b border-white/10 relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Stripe Instant Processing • No Monthly Subscription</span>
            </div>
            <h2 className="font-serif italic text-3xl sm:text-5xl text-white">
              Fair, Predictable Credit Pricing
            </h2>
            <p className="text-sm sm:text-base text-white/60">
              Pay strictly for what you use. Exactly <strong>$0.99 USD per credit</strong>. You decide how many credits you need, from 1 up to 50 credits at a time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            
            {/* Interactive Calculator Box (Col 7) */}
            <div className="lg:col-span-7 rounded-[32px] bg-[#0D0D0F] border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl">
              
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-white/60">
                  Custom Top-Up Amount
                </span>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Min: 1 • Max: 50 Credits
                </span>
              </div>

              {/* Big Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Select Allocation:</span>
                  <span className="font-serif italic font-bold text-3xl text-purple-300">
                    {calcCredits} <span className="text-base font-sans text-white/60">Credits</span>
                  </span>
                </div>
                
                <input
                  type="range"
                  min={MIN_TOP_UP_CREDITS}
                  max={MAX_TOP_UP_CREDITS}
                  value={calcCredits}
                  onChange={(e) => setCalcCredits(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                
                <div className="flex justify-between text-[10px] font-mono text-white/40">
                  <span>1 Credit ($0.99)</span>
                  <span>10 Credits ($9.90)</span>
                  <span>25 Credits ($24.75)</span>
                  <span>50 Credits Max ($49.50)</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[1, 5, 10, 25, 50].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCalcCredits(num)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition cursor-pointer border ${
                      calcCredits === num
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {num} Cr ({num === 50 ? 'Max • ' : ''}${(num * CREDIT_UNIT_PRICE_USD).toFixed(2)})
                  </button>
                ))}
              </div>

              {/* Breakdown */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-white/60">
                  <span>Unit Rate</span>
                  <span className="font-mono text-white">$0.99 USD / credit</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Contact Reveals Unlocked</span>
                  <span className="font-mono text-white">{calcCredits} Leads</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Exclusive Lock Status</span>
                  <span className="font-mono text-emerald-400">Lifetime Pipeline Protection</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold">
                  <span className="text-white">Total Amount Due</span>
                  <span className="font-serif italic text-2xl text-purple-300 font-bold font-mono">
                    ${calcTotalUsd} USD
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (currentUser) {
                    onOpenTopUp(calcCredits);
                  } else {
                    onOpenAuth('register');
                  }
                }}
                className="w-full py-4 px-6 rounded-full text-xs font-bold uppercase tracking-widest bg-purple-600 hover:bg-purple-500 text-white transition shadow-xl shadow-purple-950/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {currentUser 
                    ? `Top Up ${calcCredits} Credits for $${calcTotalUsd} USD via Stripe` 
                    : `Sign Up & Top Up ${calcCredits} Credits via Stripe`}
                </span>
              </button>

            </div>

            {/* Right Stripe Integration Details (Col 5) */}
            <div id="stripe-payment" className="lg:col-span-5 space-y-6">
              
              <div className="rounded-[32px] bg-[#0D0D0F] border border-white/10 p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Stripe Payment Processing</span>
                </div>

                <h3 className="font-serif italic text-2xl text-white">
                  Enterprise-Grade Security
                </h3>

                <p className="text-xs text-white/60 leading-relaxed">
                  NullReach uses Stripe to process lead credit transactions safely. Credit card numbers and CVC codes are never stored on NullReach servers and are processed with full PCI-DSS Level 1 compliance.
                </p>

                <div className="space-y-3 pt-2 text-xs text-white/70">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Supports Visa, Mastercard, American Express, Apple Pay</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Instant credit activation upon successful payment</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Automatic digital invoice & transaction receipts</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] text-white/50">
                  <span className="font-semibold text-white/70 block mb-1">Developer & Admin Note:</span>
                  To enable live or test Stripe charges, configure your <code className="text-purple-300 font-mono">STRIPE_SECRET_KEY</code> and <code className="text-purple-300 font-mono">STRIPE_PUBLISHABLE_KEY</code> in the Settings panel.
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* PLATFORM FEATURES */}
      <section id="features" className="py-20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <h2 className="font-serif italic text-3xl sm:text-4xl text-white">
              Engineered for Serious Dealmakers
            </h2>
            <p className="text-sm text-white/60">
              Unlike generic lead scrapers, NullReach is built for high-touch enterprise outreach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="p-8 rounded-[32px] bg-[#0D0D0F] border border-white/10 space-y-4 hover:border-purple-500/30 transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-serif italic text-2xl text-white">Exclusive Lead Locking</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                When you reveal a prospect, NullReach locks the record to your account. Competitors and team members cannot see or duplicate your outreach targets.
              </p>
            </div>

            <div className="p-8 rounded-[32px] bg-[#0D0D0F] border border-white/10 space-y-4 hover:border-purple-500/30 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="font-serif italic text-2xl text-white">$0.99 / Lead Pay-As-You-Go</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                No $5,000 yearly contracts or monthly subscription lock-ins. Buy exactly 1 to 50 credits whenever your team is prospecting.
              </p>
            </div>

            <div className="p-8 rounded-[32px] bg-[#0D0D0F] border border-white/10 space-y-4 hover:border-purple-500/30 transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-serif italic text-2xl text-white">Google Business Signals</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Direct integration with Google Business profile scores, customer review volumes, corporate revenues, and verified employee scale.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-[#0A0A0B] text-white/50 text-xs border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-serif italic font-bold text-white text-base">NullReach</span>
              <span className="text-white/40">— Enterprise B2B Lead Intelligence</span>
            </div>
            <div className="hidden sm:block text-white/20">•</div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-white/70 text-[11px]">
              <span>A product by</span>
              <span className="font-semibold text-purple-300">usecodify</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-[11px]">
            <span>Payments by Stripe</span>
            <span>256-Bit SSL Encryption</span>
            <button 
              onClick={() => onOpenAuth('login')}
              className="text-purple-300 hover:text-white transition cursor-pointer"
            >
              Member Sign In
            </button>
            <button 
              onClick={() => onOpenAuth('register')}
              className="text-purple-300 hover:text-white transition cursor-pointer"
            >
              Register (+3 Credits)
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/40">
          <div>
            © {new Date().getFullYear()} NullReach. All rights reserved. A product by usecodify.
          </div>
          <div className="flex items-center gap-4">
            <span>Exclusive Pipeline Protection</span>
            <span>PCI-DSS Compliant</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
