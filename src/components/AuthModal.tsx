import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  CheckCircle2,
  Zap,
  Coins,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'register',
}) => {
  const { login, register, allUsers, switchUser, adminSettings } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFeedback({ text: 'Please enter a valid email address.', isError: true });
      return;
    }

    if (!password) {
      setFeedback({ text: 'Please enter a password.', isError: true });
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setFeedback({ text: 'Please enter your full name.', isError: true });
        return;
      }
      if (password.length < 4) {
        setFeedback({ text: 'Password must be at least 4 characters.', isError: true });
        return;
      }
      if (password !== confirmPassword) {
        setFeedback({ text: 'Passwords do not match. Please re-type your password.', isError: true });
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const res = await register(cleanEmail, name, password, selectedRole);
        if (!res.success) {
          setFeedback({ text: res.message, isError: true });
          setIsLoading(false);
          return;
        }
        setFeedback({ text: res.message, isError: false });
      } else {
        const res = await login(cleanEmail, password);
        if (!res.success) {
          setFeedback({ text: res.message, isError: true });
          setIsLoading(false);
          return;
        }
        setFeedback({ text: res.message, isError: false });
      }

      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 700);
    } catch {
      setIsLoading(false);
      setFeedback({ text: 'An unexpected error occurred. Please try again.', isError: true });
    }
  };

  const handleQuickDemoLogin = (user: typeof allUsers[0]) => {
    switchUser(user.id);
    setEmail(user.email);
    setPassword(user.password || 'admin123');
    setFeedback({ 
      text: `Logged in as ${user.name} (${user.role === 'admin' ? 'Administrator' : 'Standard Member'})`,
      isError: false 
    });
    setTimeout(() => {
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        id="auth-modal"
        className="relative w-full max-w-md bg-[#0D0D0F] rounded-[36px] p-6 sm:p-8 shadow-2xl border border-white/10 z-10 animate-in fade-in zoom-in-95 duration-200 text-white max-h-[90vh] overflow-y-auto"
      >
        <button
          id="close-auth-modal-btn"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-bold uppercase tracking-widest text-purple-300 mb-3">
            <Coins className="w-3.5 h-3.5 text-purple-400" />
            <span>{adminSettings.registrationBonusCredits} Free Credits on Registration</span>
          </div>

          <h2 className="font-serif italic text-2xl sm:text-3xl text-white">
            {mode === 'register' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            {mode === 'register' 
              ? 'Register with working email & password credentials to explore leads.'
              : 'Sign in to access your unlocked leads, credits, or admin dashboard.'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center p-1 rounded-full bg-white/[0.03] border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setFeedback(null);
            }}
            className={`flex-1 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
              mode === 'register'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Register (+{adminSettings.registrationBonusCredits})
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setFeedback(null);
            }}
            className={`flex-1 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
              mode === 'login'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-white/30 absolute left-4 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#0A0A0B] border border-white/10 focus:border-purple-400 text-xs sm:text-sm text-white outline-none transition"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('user')}
                    className={`py-2 px-3 rounded-2xl border text-xs font-medium text-left transition flex items-center gap-2 ${
                      selectedRole === 'user'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-white/10 bg-[#0A0A0B] text-white/50 hover:text-white'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-[11px]">Member</div>
                      <div className="text-[9px] text-white/40">10 Free Credits</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`py-2 px-3 rounded-2xl border text-xs font-medium text-left transition flex items-center gap-2 ${
                      selectedRole === 'admin'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-white/10 bg-[#0A0A0B] text-white/50 hover:text-white'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-[11px]">Administrator</div>
                      <div className="text-[9px] text-purple-300">Upload Leads Sheet</div>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/30 absolute left-4 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#0A0A0B] border border-white/10 focus:border-purple-400 text-xs sm:text-sm text-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Password
              </label>
              {mode === 'login' && (
                <span className="text-[10px] text-purple-400/80 font-mono">
                  Default: admin123 / user123
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/30 absolute left-4 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-2.5 rounded-full bg-[#0A0A0B] border border-white/10 focus:border-purple-400 text-xs sm:text-sm text-white outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-2.5 text-white/40 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/30 absolute left-4 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#0A0A0B] border border-white/10 focus:border-purple-400 text-xs sm:text-sm text-white outline-none transition"
                />
              </div>
            </div>
          )}

          {feedback && (
            <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
              feedback.isError 
                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' 
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
            }`}>
              {feedback.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            id="auth-submit-btn"
            className="w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-purple-600 hover:bg-purple-500 transition shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'register' ? (
              <>
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Register & Claim 10 Credits</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Option */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
              One-Click Demo Profiles
            </span>
            <span className="text-[10px] text-purple-400 flex items-center gap-1 font-semibold uppercase tracking-wider">
              <Zap className="w-3 h-3" /> Quick Switch
            </span>
          </div>

          <div className="space-y-1.5">
            {allUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickDemoLogin(u)}
                className="w-full flex items-center justify-between p-3 rounded-[20px] bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-purple-500/30 transition text-xs text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${u.role === 'admin' ? 'bg-purple-400 ring-2 ring-purple-400/20' : 'bg-blue-400'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{u.name}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        u.role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {u.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40">{u.email} • Pass: {u.password || 'admin123'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 text-[11px] font-mono">
                  <Coins className="w-3 h-3 text-purple-400" />
                  <span>{u.credits} cr</span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
