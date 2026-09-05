import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  Download, 
  Check, 
  AlertCircle, 
  Table, 
  Layers, 
  ArrowRight,
  RefreshCw,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Lock,
  UserCheck
} from 'lucide-react';
import Papa from 'papaparse';
import { Lead, UploadBatch } from '../types';
import { getSampleCsvString, INITIAL_LEADS } from '../data/sampleLeads';
import { useAuth } from '../context/AuthContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadsImported: (leads: Lead[], mode: 'replace' | 'append', sheetName: string, batch?: UploadBatch) => void;
  onOpenAuth?: () => void;
}

interface ColumnMapping {
  name: string;
  title: string;
  company: string;
  category: string;
  email: string;
  phone: string;
  location: string;
  country: string;
  revenue: string;
  website: string;
  notes: string;
  googleBusinessUrl: string;
  googleRating: string;
  googleReviews: string;
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
  youtube: string;
  github: string;
  logoUrl: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onLeadsImported,
  onOpenAuth,
}) => {
  const { currentUser, isAdmin, allUsers, switchUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Column mapping state
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    title: '',
    company: '',
    category: '',
    email: '',
    phone: '',
    location: '',
    country: '',
    revenue: '',
    website: '',
    notes: '',
    googleBusinessUrl: '',
    googleRating: '',
    googleReviews: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    youtube: '',
    github: '',
    logoUrl: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Auto-detect mappings based on header text
  const autoDetectMapping = (headers: string[]): ColumnMapping => {
    const findHeader = (patterns: string[]): string => {
      for (const h of headers) {
        const lower = h.toLowerCase().trim();
        if (patterns.some(p => lower.includes(p))) {
          return h;
        }
      }
      return '';
    };

    return {
      name: findHeader(['full name', 'lead name', 'contact name', 'person', 'name']) || headers[0] || '',
      title: findHeader(['job title', 'role', 'designation', 'position', 'title']) || '',
      company: findHeader(['company', 'organization', 'firm', 'business', 'employer']) || '',
      category: findHeader(['category', 'industry', 'sector', 'niche', 'vertical', 'type']) || '',
      email: findHeader(['email', 'mail', 'e-mail', 'contact email']) || '',
      phone: findHeader(['phone', 'mobile', 'tel', 'cell', 'direct dial', 'contact number']) || '',
      location: findHeader(['location', 'city', 'region', 'state', 'hq', 'address']) || '',
      country: findHeader(['country', 'nation']) || '',
      revenue: findHeader(['revenue', 'arr', 'annual revenue', 'turnover', 'valuation']) || '',
      website: findHeader(['website', 'url', 'domain', 'web', 'link']) || '',
      notes: findHeader(['notes', 'tags', 'summary', 'intel', 'description', 'comments']) || '',
      googleBusinessUrl: findHeader(['google business', 'google map', 'google profile', 'gmb']) || '',
      googleRating: findHeader(['google rating', 'rating', 'stars', 'score']) || '',
      googleReviews: findHeader(['google reviews', 'reviews count', 'review count', 'reviews']) || '',
      linkedin: findHeader(['linkedin', 'linkedin profile']) || '',
      twitter: findHeader(['twitter', 'x.com', 'x handle', 'x profile']) || '',
      facebook: findHeader(['facebook', 'fb']) || '',
      instagram: findHeader(['instagram', 'ig']) || '',
      youtube: findHeader(['youtube', 'yt']) || '',
      github: findHeader(['github', 'git']) || '',
      logoUrl: findHeader(['logo', 'company logo', 'avatar', 'icon url']) || '',
    };
  };

  const processCsvContent = (csvString: string, sourceName: string) => {
    setErrorMsg(null);
    try {
      Papa.parse<Record<string, string>>(csvString, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            setErrorMsg('No readable rows found in the CSV file.');
            return;
          }

          const headers = results.meta.fields || Object.keys(results.data[0] || {});
          if (headers.length === 0) {
            setErrorMsg('Could not detect header columns in the CSV.');
            return;
          }

          setDetectedHeaders(headers);
          setParsedRows(results.data);
          setFileName(sourceName);
          setMapping(autoDetectMapping(headers));
        },
        error: (err: Error) => {
          setErrorMsg(`CSV Parsing error: ${err.message}`);
        }
      });
    } catch (err: unknown) {
      setErrorMsg(`Failed to parse CSV: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) processCsvContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) processCsvContent(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handlePasteProcess = () => {
    if (!rawText.trim()) {
      setErrorMsg('Please paste your CSV data first.');
      return;
    }
    processCsvContent(rawText, 'Pasted Google Sheet CSV');
  };

  const handleLoadSample = () => {
    const sampleCsv = getSampleCsvString();
    processCsvContent(sampleCsv, 'Sample Enterprise Leads (Google Sheet)');
  };

  const handleDownloadTemplate = () => {
    const csvContent = getSampleCsvString();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'google_sheet_leads_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = () => {
    if (!isAdmin) {
      setErrorMsg('Administrator privileges are required to upload or modify lead sheets.');
      return;
    }

    if (parsedRows.length === 0) {
      setErrorMsg('No rows to import.');
      return;
    }

    const batchId = `batch-${Date.now()}`;
    const batchName = fileName || 'Uploaded Lead Sheet';
    const nowIso = new Date().toISOString();

    const transformedLeads: Lead[] = parsedRows.map((row, index) => {
      const name = (mapping.name ? row[mapping.name] : '') || `Lead ${index + 1}`;
      const title = (mapping.title ? row[mapping.title] : '') || 'Executive';
      const company = (mapping.company ? row[mapping.company] : '') || 'Enterprise Inc.';
      const category = (mapping.category ? row[mapping.category] : '') || 'General B2B';
      const email = (mapping.email ? row[mapping.email] : '') || `contact${index + 1}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      const phone = (mapping.phone ? row[mapping.phone] : '') || '+1 (555) 000-0000';
      const location = (mapping.location ? row[mapping.location] : '') || 'Global';
      const country = (mapping.country ? row[mapping.country] : '') || 'United States';
      const revenue = mapping.revenue ? row[mapping.revenue] : undefined;
      const website = mapping.website ? row[mapping.website] : undefined;
      const notes = mapping.notes ? row[mapping.notes] : undefined;
      const googleBusinessUrl = mapping.googleBusinessUrl ? row[mapping.googleBusinessUrl] : `https://maps.google.com/?q=${encodeURIComponent(company + ' ' + location)}`;
      const rawRating = mapping.googleRating ? parseFloat(row[mapping.googleRating]) : NaN;
      const googleRating = !isNaN(rawRating) ? rawRating : 4.8;
      const rawReviews = mapping.googleReviews ? parseInt(row[mapping.googleReviews], 10) : NaN;
      const googleReviewsCount = !isNaN(rawReviews) ? rawReviews : 120;
      const logoUrl = mapping.logoUrl ? row[mapping.logoUrl] : undefined;

      const socials = {
        linkedin: mapping.linkedin ? row[mapping.linkedin] : undefined,
        twitter: mapping.twitter ? row[mapping.twitter] : undefined,
        facebook: mapping.facebook ? row[mapping.facebook] : undefined,
        instagram: mapping.instagram ? row[mapping.instagram] : undefined,
        youtube: mapping.youtube ? row[mapping.youtube] : undefined,
        github: mapping.github ? row[mapping.github] : undefined,
      };

      return {
        id: `lead-imported-${Date.now()}-${index}`,
        name: name.trim(),
        title: title.trim(),
        company: company.trim(),
        category: category.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        country: country.trim(),
        revenue: revenue?.trim(),
        website: website?.trim(),
        notes: notes?.trim(),
        googleBusinessUrl: googleBusinessUrl.trim(),
        googleRating,
        googleReviewsCount,
        socials,
        logoUrl: logoUrl?.trim(),
        batchId,
        batchName,
        uploadedAt: nowIso
      };
    });

    const uploadBatch: UploadBatch = {
      id: batchId,
      sheetName: batchName,
      timestamp: nowIso,
      leadCount: transformedLeads.length,
      uploadedByUserId: currentUser?.id || 'admin',
      uploadedByUserName: currentUser?.name || 'Administrator',
      mode: importMode,
      fileType: activeTab === 'upload' ? 'csv' : 'paste'
    };

    onLeadsImported(transformedLeads, importMode, batchName, uploadBatch);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Liquid backdrop */}
      <div 
        className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        id="upload-modal"
        className="relative w-full max-w-2xl bg-[#0D0D0F] rounded-[36px] p-6 sm:p-8 shadow-2xl border border-white/10 z-10 animate-in fade-in zoom-in-95 duration-200 text-white"
      >
        <button
          id="close-upload-modal-btn"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-widest text-purple-300 mb-2">
            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isAdmin ? 'Admin Authorized • Google Sheets & CSV Importer' : 'Admin Restricted Area'}</span>
          </div>
          <h2 className="font-serif italic text-2xl sm:text-3xl text-white">
            Upload Leads Sheet
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            {isAdmin 
              ? 'Export your Google Sheet as CSV (File → Download → Comma Separated Values .csv) and upload it here.'
              : 'Lead sheet management and database uploads are restricted to administrators.'}
          </p>
        </div>

        {/* If user is not admin, show clear Admin Access Gate */}
        {!isAdmin ? (
          <div className="py-6 px-2 text-center max-w-md mx-auto space-y-5">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif italic text-xl sm:text-2xl text-white">
                Admin Authorization Required
              </h3>
              <p className="text-xs text-white/50 leading-relaxed mt-2">
                Only users with an <strong className="text-purple-300">Administrator role</strong> can import new sheets or modify the lead database.
                {currentUser ? (
                  <span className="block mt-1 text-white/70">
                    You are currently logged in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.role}).
                  </span>
                ) : (
                  <span className="block mt-1 text-white/70">
                    You are currently not signed in.
                  </span>
                )}
              </p>
            </div>

            {/* Quick action to switch or sign in as Admin */}
            <div className="p-4 rounded-[24px] bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="text-[11px] font-semibold text-white/70">
                Switch to Admin Account:
              </div>
              <div className="space-y-2">
                {allUsers.filter(u => u.role === 'admin').map((adminUser) => (
                  <button
                    key={adminUser.id}
                    type="button"
                    onClick={() => {
                      switchUser(adminUser.id);
                      setErrorMsg(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-purple-950/40"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Log In as {adminUser.name}</span>
                  </button>
                ))}
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 underline font-medium block mx-auto pt-1"
                >
                  Or sign in with custom credentials
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition"
            >
              Close Window
            </button>
          </div>
        ) : (
          <>
            {/* Step 1: No file parsed yet */}
            {parsedRows.length === 0 ? (
              <div className="space-y-4">
            
                {/* Tabs */}
                <div className="flex items-center gap-2 p-1 rounded-full bg-white/[0.03] border border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                      activeTab === 'upload'
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Upload CSV File
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('paste')}
                    className={`flex-1 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                      activeTab === 'paste'
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Paste CSV Text
                  </button>
                </div>

            {activeTab === 'upload' ? (
              /* Drag and Drop Zone */
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[28px] p-8 sm:p-10 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-purple-400 bg-purple-500/10 scale-[1.01]' 
                    : 'border-white/10 hover:border-purple-500/40 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-purple-400">
                  <Upload className="w-6 h-6" />
                </div>

                <h3 className="font-serif italic text-lg text-white mb-1">
                  Drag & drop your Google Sheet CSV here
                </h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto mb-4">
                  Supports standard CSV files with headers like Name, Company, Category/Industry, Email, Phone.
                </p>

                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/15 transition">
                  <span>Browse File From Computer</span>
                </div>
              </div>
            ) : (
              /* Paste Raw CSV Area */
              <div className="space-y-3">
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste your CSV content here (including header row)...&#10;Full Name, Job Title, Company, Category, Email, Phone, Location&#10;Alex Rivera, CEO, Apex AI, AI & Machine Learning, alex@apex.ai, +1 415-555-0199, San Francisco"
                  rows={6}
                  className="w-full px-4 py-3 rounded-[24px] bg-[#0A0A0B] border border-white/10 focus:border-purple-400 text-xs sm:text-sm font-mono text-white outline-none transition"
                />
                <button
                  type="button"
                  onClick={handlePasteProcess}
                  className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-purple-600 hover:bg-purple-500 transition shadow-lg shadow-purple-950/40"
                >
                  Parse Pasted CSV Data
                </button>
              </div>
            )}

            {/* Quick Actions: Load Sample or Download Template */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5 text-xs">
              <button
                type="button"
                onClick={handleLoadSample}
                className="flex items-center gap-1.5 text-purple-300 hover:text-purple-200 font-semibold transition"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Load Sample Sheet (16 Leads)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

          </div>
        ) : (
          /* Step 2: Columns Mapping & Preview */
          <div className="space-y-5">
            
            {/* Header Status */}
            <div className="flex items-center justify-between p-3.5 rounded-[22px] bg-white/[0.03] border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-white truncate max-w-[200px]">
                  {fileName}
                </span>
                <span className="text-white/40">
                  • <strong>{parsedRows.length}</strong> leads parsed
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setDetectedHeaders([]);
                }}
                className="flex items-center gap-1 text-white/40 hover:text-white transition text-[11px]"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Upload Different File</span>
              </button>
            </div>

            {/* Column Mapper Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                  Confirm Column Mapping
                </h4>
                <span className="text-[10px] text-white/40">
                  Auto-detected from sheet headers
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-[24px] bg-white/[0.02] border border-white/5 text-xs">
                {/* Full Name */}
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">
                    Name <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={mapping.name}
                    onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs outline-none"
                  >
                    <option value="">-- Select Column --</option>
                    {detectedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Company */}
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">
                    Company <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={mapping.company}
                    onChange={(e) => setMapping({ ...mapping, company: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs outline-none"
                  >
                    <option value="">-- Select Column --</option>
                    {detectedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">
                    Category / Industry <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={mapping.category}
                    onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs outline-none"
                  >
                    <option value="">-- Select Column --</option>
                    {detectedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">Job Title</label>
                  <select
                    value={mapping.title}
                    onChange={(e) => setMapping({ ...mapping, title: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs outline-none"
                  >
                    <option value="">-- Select Column --</option>
                    {detectedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">Email</label>
                  <select
                    value={mapping.email}
                    onChange={(e) => setMapping({ ...mapping, email: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs outline-none"
                  >
                    <option value="">-- Select Column --</option>
                    {detectedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">Phone</label>
                  <select
                    value={mapping.phone}
                    onChange={(e) => setMapping({ ...mapping, phone: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-white text-xs outline-none"
                  >
                    <option value="">-- Select Column --</option>
                    {detectedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Preview of first 2 leads */}
            <div>
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">
                Sample Parsed Row Preview
              </h4>
              <div className="p-3.5 rounded-[22px] bg-[#0A0A0B] border border-white/10 overflow-x-auto text-[11px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider text-[10px]">
                      <th className="pb-2 pr-3">Name</th>
                      <th className="pb-2 pr-3">Company</th>
                      <th className="pb-2 pr-3">Category</th>
                      <th className="pb-2 pr-3">Email</th>
                      <th className="pb-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    {parsedRows.slice(0, 2).map((row, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="py-2.5 pr-3 font-serif italic text-white text-sm">
                          {mapping.name ? row[mapping.name] : 'N/A'}
                        </td>
                        <td className="py-2.5 pr-3 text-purple-300 font-medium">
                          {mapping.company ? row[mapping.company] : 'N/A'}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full text-[10px]">
                            {mapping.category ? row[mapping.category] : 'General'}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-white/40">
                          {mapping.email ? row[mapping.email] : 'N/A'}
                        </td>
                        <td className="py-2.5 font-mono text-white/40">
                          {mapping.phone ? row[mapping.phone] : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import Mode: Append (Default) or Replace */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-white">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="accent-purple-500 w-4 h-4"
                    />
                    <span className="font-semibold text-purple-200">Append & Merge (Recommended)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-white/70">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-purple-500 w-4 h-4"
                    />
                    <span>Replace Directory ({parsedRows.length} leads)</span>
                  </label>
                </div>
              </div>
              
              <div className="text-[11px] text-emerald-300/90 flex items-center gap-1.5 pt-1 border-t border-white/5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Past Records Safe:</strong> All user accounts, unlocked leads, bookmarked favorites, private CRM notes, and credit ledger records are permanently preserved and will not be deleted.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setParsedRows([])}
                className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition"
              >
                Back
              </button>

              <button
                type="button"
                id="confirm-import-sheet-btn"
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-7 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-purple-600 hover:bg-purple-500 transition shadow-xl shadow-purple-950/40 cursor-pointer"
              >
                {isSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Imported Successfully!</span>
                  </>
                ) : (
                  <>
                    <span>Import {parsedRows.length} Leads</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        )}
          </>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

      </div>
    </div>
  );
};
