export interface LeadSocials {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
}

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  category: string;
  email: string;
  phone: string;
  location: string;
  country?: string;
  website?: string;
  revenue?: string;
  employees?: string;
  linkedin?: string;
  notes?: string;
  unlockedByDefault?: boolean;
  logoUrl?: string;
  googleBusinessUrl?: string;
  googleRating?: number;
  googleReviewsCount?: number;
  socials?: LeadSocials;
  claimedByUserId?: string;
  claimedByUserName?: string;
  claimedAt?: string;
  batchId?: string;
  batchName?: string;
  uploadedAt?: string;
}

export interface UploadBatch {
  id: string;
  sheetName: string;
  timestamp: string;
  leadCount: number;
  uploadedByUserId: string;
  uploadedByUserName: string;
  mode: 'replace' | 'append';
  fileType?: string;
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  credits: number;
  unlockedLeadIds: string[];
  bookmarkedLeadIds?: string[];
  viewedLeadIds?: string[];
  privateNotes?: Record<string, string>; // leadId -> user-specific note
  createdAt: string;
  company?: string;
  title?: string;
}

export interface AdminSettings {
  exclusiveLeadViewing: boolean; // If true: viewed/claimed leads become invisible to other users
  adminCanViewAllLeads: boolean; // If true: Admins can see all leads regardless of claim status
  costPerUnlock: number; // Credits to reveal lead (default: 1)
  registrationBonusCredits: number; // Free credits for new registrations (default: 3)
  allowUserPrivateNotes: boolean; // Enable/disable private CRM notes
  showSocialMedia: boolean; // Display social media links
  showGoogleBusiness: boolean; // Display Google Business profile and ratings
  showCompanyLogos: boolean; // Display brand logos
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'bonus' | 'spend' | 'purchase';
  amount: number; // positive for add, negative for spend
  description: string;
  timestamp: string;
  priceUsd?: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  badge?: string;
  popular?: boolean;
  unitPrice: string;
}

export interface FilterState {
  searchQuery: string;
  category: string;
  country: string;
  location: string;
  status: 'all' | 'unlocked' | 'locked' | 'bookmarked' | 'viewed';
  sortBy: 'name' | 'company' | 'category' | 'recent';
}
