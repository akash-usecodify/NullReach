import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CreditTransaction, UserRole, AdminSettings } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  transactions: CreditTransaction[];
  adminSettings: AdminSettings;
  updateAdminSettings: (newSettings: Partial<AdminSettings>) => void;
  saveLeadUserNote: (leadId: string, noteText: string) => void;
  getUserLeadNote: (leadId: string) => string;
  updateUserCreditsAdmin: (userId: string, amount: number) => void;
  changeUserRoleAdmin: (userId: string, newRole: UserRole) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, name: string, password: string, role?: UserRole) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  unlockLead: (leadId: string) => { success: boolean; message: string };
  isLeadUnlocked: (leadId: string) => boolean;
  toggleBookmarkLead: (leadId: string) => { bookmarked: boolean; message: string };
  isLeadBookmarked: (leadId: string) => boolean;
  recordLeadView: (leadId: string) => void;
  updateProfile: (data: { name?: string; password?: string; company?: string; title?: string }) => { success: boolean; message: string };
  topUpCredits: (amount: number, priceUsd: number, packName: string) => void;
  allUsers: User[];
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'leadflow_users_v3';
const CURRENT_USER_ID_KEY = 'leadflow_current_user_id_v3';
const TRANSACTIONS_STORAGE_KEY = 'leadflow_transactions_v3';
const ADMIN_SETTINGS_STORAGE_KEY = 'leadflow_admin_settings_v3';

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  exclusiveLeadViewing: true,
  adminCanViewAllLeads: true,
  costPerUnlock: 1,
  registrationBonusCredits: 3,
  allowUserPrivateNotes: true,
  showSocialMedia: true,
  showGoogleBusiness: true,
  showCompanyLogos: true,
};

export const TEST_ACCOUNTS = [
  {
    roleName: 'Administrator 1',
    role: 'admin' as UserRole,
    name: 'Akash Suresh',
    email: 'akashsuresh2403@gmail.com',
    password: 'admin123',
    description: 'Master platform administrator with sheet upload & configuration privileges.'
  },
  {
    roleName: 'Administrator 2',
    role: 'admin' as UserRole,
    name: 'Elena Rostova',
    email: 'admin@fluxleads.com',
    password: 'admin456',
    description: 'Data operations administrator with elevated 100-credit allocation.'
  },
  {
    roleName: 'Member 1 (Growth)',
    role: 'user' as UserRole,
    name: 'Marcus Vance',
    email: 'marcus.vance@apexscale.com',
    password: 'user123',
    description: 'Growth & pipeline lead with active unlocked tech leads.'
  },
  {
    roleName: 'Member 2 (Venture)',
    role: 'user' as UserRole,
    name: 'Sarah Chen',
    email: 'sarah.chen@venture.io',
    password: 'user456',
    description: 'Venture investor profile with bookmarked AI & biotech executives.'
  },
  {
    roleName: 'Member 3 (Outreach)',
    role: 'user' as UserRole,
    name: 'David Miller',
    email: 'david.miller@outreach.co',
    password: 'user789',
    description: 'Enterprise outreach specialist exploring e-commerce prospects.'
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-1',
    email: 'akashsuresh2403@gmail.com',
    name: 'Akash Suresh',
    role: 'admin',
    password: 'admin123',
    title: 'Chief Executive & Admin',
    company: 'Flux Intelligence',
    credits: 50,
    unlockedLeadIds: ['lead-1', 'lead-2'],
    bookmarkedLeadIds: ['lead-1', 'lead-2', 'lead-4'],
    viewedLeadIds: ['lead-1', 'lead-2', 'lead-3', 'lead-4'],
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'user-admin-2',
    email: 'admin@fluxleads.com',
    name: 'Elena Rostova',
    role: 'admin',
    password: 'admin456',
    title: 'Operations Director & Admin',
    company: 'Neural Capital',
    credits: 100,
    unlockedLeadIds: ['lead-3', 'lead-5'],
    bookmarkedLeadIds: ['lead-3', 'lead-5', 'lead-7'],
    viewedLeadIds: ['lead-1', 'lead-3', 'lead-4', 'lead-5', 'lead-7'],
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'user-regular-1',
    email: 'marcus.vance@apexscale.com',
    name: 'Marcus Vance',
    role: 'user',
    password: 'user123',
    title: 'VP of Growth & Pipeline',
    company: 'Apex Scale Partners',
    credits: 15,
    unlockedLeadIds: ['lead-2'],
    bookmarkedLeadIds: ['lead-2', 'lead-4', 'lead-8'],
    viewedLeadIds: ['lead-1', 'lead-2', 'lead-4', 'lead-8'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'user-regular-2',
    email: 'sarah.chen@venture.io',
    name: 'Sarah Chen',
    role: 'user',
    password: 'user456',
    title: 'Venture Scout & Partner',
    company: 'Horizon Seed Ventures',
    credits: 20,
    unlockedLeadIds: ['lead-1', 'lead-3'],
    bookmarkedLeadIds: ['lead-1', 'lead-3', 'lead-6'],
    viewedLeadIds: ['lead-1', 'lead-2', 'lead-3', 'lead-6'],
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'user-regular-3',
    email: 'david.miller@outreach.co',
    name: 'David Miller',
    role: 'user',
    password: 'user789',
    title: 'Enterprise Account Executive',
    company: 'HyperGrowth Systems',
    credits: 3,
    unlockedLeadIds: [],
    bookmarkedLeadIds: ['lead-4', 'lead-5'],
    viewedLeadIds: ['lead-4', 'lead-5'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

const INITIAL_TRANSACTIONS: CreditTransaction[] = [
  {
    id: 'tx-admin-1',
    userId: 'user-admin-1',
    type: 'bonus',
    amount: 50,
    description: 'Admin Initial Balance Allocation (50 Credits)',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'tx-admin-1-spend1',
    userId: 'user-admin-1',
    type: 'spend',
    amount: -1,
    description: 'Lead Intel Unlocked (Elena Rostova)',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'tx-admin-1-spend2',
    userId: 'user-admin-1',
    type: 'spend',
    amount: -1,
    description: 'Lead Intel Unlocked (Marcus Vance)',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'tx-admin-2',
    userId: 'user-admin-2',
    type: 'bonus',
    amount: 100,
    description: 'Operations Admin Grant (100 Credits)',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'tx-user-1',
    userId: 'user-regular-1',
    type: 'bonus',
    amount: 15,
    description: 'Growth Partner Welcome Grant (15 Credits)',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'tx-user-2',
    userId: 'user-regular-2',
    type: 'bonus',
    amount: 20,
    description: 'Venture Scout Bonus (20 Credits)',
    timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'tx-user-3',
    userId: 'user-regular-3',
    type: 'bonus',
    amount: 3,
    description: 'Registration Welcome Bonus (3 Credits)',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure every user has a role and password
          return parsed.map((u: Partial<User>) => ({
            ...u,
            role: u.role || (u.email?.toLowerCase() === 'akashsuresh2403@gmail.com' || u.email?.toLowerCase().startsWith('admin') ? 'admin' : 'user'),
            password: u.password || 'admin123',
          })) as User[];
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_ID_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'user-admin-1';
  });

  const [transactions, setTransactions] = useState<CreditTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_TRANSACTIONS;
  });

  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If stored was previous default 10, update to new default of 3
        if (parsed && (parsed.registrationBonusCredits === 10 || parsed.registrationBonusCredits === undefined)) {
          parsed.registrationBonusCredits = 3;
        }
        return { ...DEFAULT_ADMIN_SETTINGS, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_ADMIN_SETTINGS;
  });

  // Sync admin settings to storage
  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(adminSettings));
    } catch {
      // ignore
    }
  }, [adminSettings]);

  // Sync users to storage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  // Sync currentUserId to storage
  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.setItem(CURRENT_USER_ID_KEY, currentUserId);
      } else {
        localStorage.removeItem(CURRENT_USER_ID_KEY);
      }
    } catch {
      // ignore
    }
  }, [currentUserId]);

  // Sync transactions to storage
  useEffect(() => {
    try {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    } catch {
      // ignore
    }
  }, [transactions]);

  const currentUser = users.find(u => u.id === currentUserId) || null;
  const isAdmin = currentUser?.role === 'admin';

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }

    const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!existingUser) {
      return { 
        success: false, 
        message: 'No account found with this email. Please click "Register" to create a new account.' 
      };
    }

    // Check password
    if (existingUser.password && existingUser.password !== password) {
      return { 
        success: false, 
        message: 'Incorrect password. Please verify your credentials and try again.' 
      };
    }

    setCurrentUserId(existingUser.id);
    return { 
      success: true, 
      message: `Signed in as ${existingUser.name} (${existingUser.role === 'admin' ? 'Administrator' : 'Member'})` 
    };
  };

  const register = async (
    email: string, 
    name: string, 
    password: string, 
    role?: UserRole
  ): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (!name.trim()) {
      return { success: false, message: 'Please provide your full name.' };
    }

    if (!password || password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      return { 
        success: false, 
        message: 'An account with this email address already exists. Please sign in instead.' 
      };
    }

    // Determine role: explicitly assigned, or auto-assigned if admin email
    const assignedRole: UserRole = role || (
      cleanEmail === 'akashsuresh2403@gmail.com' || cleanEmail.startsWith('admin') 
        ? 'admin' 
        : 'user'
    );

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      name: name.trim(),
      role: assignedRole,
      password: password,
      credits: assignedRole === 'admin' ? 50 : adminSettings.registrationBonusCredits,
      unlockedLeadIds: [],
      createdAt: new Date().toISOString(),
    };

    const welcomeTx: CreditTransaction = {
      id: `tx-${Date.now()}`,
      userId: newUser.id,
      type: 'bonus',
      amount: newUser.credits,
      description: assignedRole === 'admin' 
        ? 'Admin Initial Balance (50 Credits)' 
        : `Registration Bonus: ${adminSettings.registrationBonusCredits} Free Credits`,
      timestamp: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);
    setTransactions(prev => [welcomeTx, ...prev]);
    setCurrentUserId(newUser.id);
    
    // Asynchronously dispatch welcome email and admin alert notification
    fetch('/api/email/on-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newUser.name,
        email: newUser.email,
        credits: newUser.credits,
        role: newUser.role,
        timestamp: newUser.createdAt
      })
    }).catch(err => {
      console.warn('Registration email dispatch notice:', err);
    });

    return { 
      success: true, 
      message: `Account created successfully as ${assignedRole === 'admin' ? 'Administrator' : 'Member'}! Welcome aboard.` 
    };
  };

  const logout = () => {
    setCurrentUserId(null);
  };

  const switchUser = (userId: string) => {
    if (users.some(u => u.id === userId)) {
      setCurrentUserId(userId);
    }
  };

  const isLeadUnlocked = (leadId: string): boolean => {
    if (!currentUser) return false;
    return (currentUser.unlockedLeadIds || []).includes(leadId);
  };

  const isLeadBookmarked = (leadId: string): boolean => {
    if (!currentUser) return false;
    return (currentUser.bookmarkedLeadIds || []).includes(leadId);
  };

  const toggleBookmarkLead = (leadId: string): { bookmarked: boolean; message: string } => {
    if (!currentUser) {
      return { bookmarked: false, message: 'Please sign in to bookmark leads.' };
    }

    const currentBookmarks = currentUser.bookmarkedLeadIds || [];
    const exists = currentBookmarks.includes(leadId);
    const updatedBookmarks = exists
      ? currentBookmarks.filter(id => id !== leadId)
      : [...currentBookmarks, leadId];

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          bookmarkedLeadIds: updatedBookmarks,
        };
      }
      return u;
    }));

    return {
      bookmarked: !exists,
      message: !exists ? 'Lead added to saved favorites ⭐' : 'Lead removed from favorites'
    };
  };

  const recordLeadView = (leadId: string) => {
    if (!currentUser) return;
    const currentViewed = currentUser.viewedLeadIds || [];
    // Move to front if exists, or prepend
    const updatedViewed = [leadId, ...currentViewed.filter(id => id !== leadId)].slice(0, 50);

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          viewedLeadIds: updatedViewed,
        };
      }
      return u;
    }));
  };

  const updateProfile = (data: { name?: string; password?: string; company?: string; title?: string }): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'You must be signed in to update your profile.' };
    }

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          name: data.name?.trim() || u.name,
          password: data.password || u.password,
          company: data.company !== undefined ? data.company.trim() : u.company,
          title: data.title !== undefined ? data.title.trim() : u.title,
        };
      }
      return u;
    }));

    return { success: true, message: 'Profile updated successfully.' };
  };

  const unlockLead = (leadId: string): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'Please register or log in to unlock lead details.' };
    }

    if ((currentUser.unlockedLeadIds || []).includes(leadId)) {
      return { success: true, message: 'Lead is already unlocked!' };
    }

    const cost = Math.max(0, adminSettings.costPerUnlock);

    if (cost > 0 && currentUser.credits < cost) {
      return { 
        success: false, 
        message: `Insufficient credits. You need ${cost} credit${cost > 1 ? 's' : ''} to reveal this lead. Please top up your balance.` 
      };
    }

    // Deduct credit & append to unlocked leads
    const updatedCredits = currentUser.credits - cost;
    const updatedUnlocked = [...(currentUser.unlockedLeadIds || []), leadId];

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          credits: updatedCredits,
          unlockedLeadIds: updatedUnlocked,
        };
      }
      return u;
    }));

    if (cost > 0) {
      const spendTx: CreditTransaction = {
        id: `tx-${Date.now()}`,
        userId: currentUser.id,
        type: 'spend',
        amount: -cost,
        description: `Lead View Unlocked (Lead #${leadId.slice(0, 8)})`,
        timestamp: new Date().toISOString(),
      };
      setTransactions(prev => [spendTx, ...prev]);
    }

    return { 
      success: true, 
      message: cost > 0 
        ? `Lead unlocked! ${cost} credit${cost > 1 ? 's' : ''} spent. (${updatedCredits} credits remaining)`
        : 'Lead unlocked for free!' 
    };
  };

  const updateAdminSettings = (newSettings: Partial<AdminSettings>) => {
    setAdminSettings(prev => ({ ...prev, ...newSettings }));
  };

  const saveLeadUserNote = (leadId: string, noteText: string) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          privateNotes: {
            ...(u.privateNotes || {}),
            [leadId]: noteText,
          }
        };
      }
      return u;
    }));
  };

  const getUserLeadNote = (leadId: string): string => {
    if (!currentUser || !currentUser.privateNotes) return '';
    return currentUser.privateNotes[leadId] || '';
  };

  const updateUserCreditsAdmin = (userId: string, amount: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newCredits = Math.max(0, u.credits + amount);
        return { ...u, credits: newCredits };
      }
      return u;
    }));

    const adjustTx: CreditTransaction = {
      id: `tx-admin-${Date.now()}`,
      userId: userId,
      type: amount >= 0 ? 'bonus' : 'spend',
      amount: amount,
      description: `Admin balance adjustment (${amount >= 0 ? '+' : ''}${amount} credits)`,
      timestamp: new Date().toISOString(),
    };
    setTransactions(prev => [adjustTx, ...prev]);
  };

  const changeUserRoleAdmin = (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, role: newRole };
      }
      return u;
    }));
  };

  const topUpCredits = (amount: number, priceUsd: number, packName: string) => {
    if (!currentUser) return;

    // Enforce min 1 and max 50 credits per top-up
    const safeAmount = Math.max(1, Math.min(50, Math.round(amount)));
    const safePrice = priceUsd > 0 ? priceUsd : Number((safeAmount * 0.99).toFixed(2));
    const newBalance = currentUser.credits + safeAmount;

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          credits: newBalance,
        };
      }
      return u;
    }));

    const purchaseTx: CreditTransaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.id,
      type: 'purchase',
      amount: safeAmount,
      priceUsd: safePrice,
      description: `Top-up: ${packName || `${safeAmount} Credits`} (+${safeAmount} credits)`,
      timestamp: new Date().toISOString(),
    };

    setTransactions(prev => [purchaseTx, ...prev]);
  };

  const userTransactions = transactions.filter(t => currentUser && t.userId === currentUser.id);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAdmin,
        transactions: userTransactions,
        adminSettings,
        updateAdminSettings,
        saveLeadUserNote,
        getUserLeadNote,
        updateUserCreditsAdmin,
        changeUserRoleAdmin,
        login,
        register,
        logout,
        unlockLead,
        isLeadUnlocked,
        toggleBookmarkLead,
        isLeadBookmarked,
        recordLeadView,
        updateProfile,
        topUpCredits,
        allUsers: users,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
