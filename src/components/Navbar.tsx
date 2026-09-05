import React, { useState } from 'react';
import { 
  Sparkles, 
  Coins, 
  Upload, 
  Plus, 
  User as UserIcon, 
  LogOut, 
  History, 
  ChevronDown,
  Layers,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenTopUp: () => void;
  onOpenAuth: () => void;
  onOpenHistory: () => void;
  onOpenProfile?: () => void;
  leadsCount: number;
  sheetTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUpload,
  onOpenTopUp,
  onOpenAuth,
  onOpenHistory,
  onOpenProfile,
  leadsCount,
  sheetTitle,
}) => {
  const { currentUser, isAuthenticated, isAdmin, logout, allUsers, switchUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0A0A0B]/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand & Active Dataset */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[1.5px] shadow-lg shadow-purple-900/20 border border-white/10">
              <div className="w-full h-full rounded-full bg-[#0D0D0F] flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif italic text-2xl tracking-tight text-white mb-0">
                  Flux<span className="text-purple-400">Leads</span>
                </h1>
                <span className="px-2.5 py-0.5 text-[9px] font-bold tracking-[0.2em] uppercase rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Portal
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 hidden sm:block">
                Intelligence Portal
              </p>
            </div>
          </div>

          {/* Dataset Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span className="max-w-[140px] truncate text-white/50 font-medium">
              {sheetTitle}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span className="font-semibold text-white/90">{leadsCount} leads</span>
          </div>
        </div>

        {/* Right Actions: Upload Sheet (Admin Only), Credits & Top-Up, User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          
          {/* Upload Sheet Button - RESTRICTED TO ADMIN ONLY */}
          {isAdmin && (
            <button
              id="nav-upload-button"
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs uppercase tracking-widest font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all duration-200 shadow-sm"
              title="Admin Privilege: Upload new CSV from Google Sheets"
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Upload CSV</span>
              <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded font-mono font-bold">ADMIN</span>
            </button>
          )}

          {/* Credits Badge & Top-Up Button */}
          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-white/5 border border-white/10 shadow-inner">
              <div 
                onClick={onOpenHistory}
                className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer hover:opacity-80 transition"
                title="Click to view credit transaction history"
              >
                <span className="text-xs text-white/50">Balance:</span>
                <span className="text-sm font-bold text-purple-400 tracking-tight">
                  {currentUser.credits.toString().padStart(2, '0')} Credits
                </span>
              </div>

              {/* Top-Up Trigger Button */}
              <button
                id="nav-topup-button"
                onClick={onOpenTopUp}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-purple-600 hover:bg-purple-500 transition shadow-md shadow-purple-950/40"
              >
                <Plus className="w-3 h-3" />
                <span>Top Up</span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>10 Free Credits on Register</span>
            </div>
          )}

          {/* User Account / Login */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                id="user-menu-trigger"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 sm:pl-2 sm:pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition text-xs text-white"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 border border-white/20 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline font-medium max-w-[100px] truncate text-white/80">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-white/40" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-2xl liquid-card p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 border border-white/10"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="p-3 border-b border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-white truncate">
                        {currentUser.name}
                      </p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        currentUser.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {currentUser.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">
                      {currentUser.email}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-xs bg-[#0A0A0B] px-3 py-1.5 rounded-xl border border-white/10">
                      <span className="text-white/40">Available Credits</span>
                      <span className="font-bold text-purple-400 font-mono">{currentUser.credits}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    {onOpenProfile && (
                      <button
                        onClick={onOpenProfile}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-white/90 hover:text-white hover:bg-white/5 rounded-xl transition font-medium"
                      >
                        <UserIcon className="w-4 h-4 text-purple-400" />
                        My Profile & Saved Leads
                      </button>
                    )}

                    <button
                      onClick={onOpenTopUp}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition"
                    >
                      <Plus className="w-4 h-4 text-purple-400" />
                      Buy Credits (10 for $2 USD)
                    </button>

                    <button
                      onClick={onOpenHistory}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition"
                    >
                      <History className="w-4 h-4 text-purple-400/60" />
                      Credit Activity & History
                    </button>

                    {isAdmin && (
                      <button
                        onClick={onOpenUpload}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-purple-300 hover:text-white hover:bg-purple-500/10 rounded-xl transition font-medium"
                      >
                        <Layers className="w-4 h-4 text-purple-400" />
                        <span>Upload New Leads Sheet</span>
                        <span className="ml-auto text-[9px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded font-mono">ADMIN</span>
                      </button>
                    )}
                  </div>

                  {/* Switch Demo Accounts */}
                  <div className="pt-2 border-t border-white/10">
                    <p className="px-3 py-1 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Switch Demo Profile
                    </p>
                    {allUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => switchUser(user.id)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left rounded-lg transition ${
                          user.id === currentUser.id 
                            ? 'bg-purple-500/20 text-purple-200 font-medium' 
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">
                          {user.name} {user.role === 'admin' ? '(Admin)' : ''}
                        </span>
                        <span className="text-[10px] opacity-75 font-mono">{user.credits} cr</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 mt-1 border-t border-white/10">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-rose-400 hover:bg-rose-500/10 rounded-xl transition font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="nav-login-button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white liquid-button transition shadow-md"
            >
              <UserIcon className="w-4 h-4" />
              <span>Login / Register</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
