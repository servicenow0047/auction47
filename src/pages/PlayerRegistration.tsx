
import { useState, useEffect, useMemo } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuctionStore } from '../store/useAuctionStore';
import { api } from '../lib/api';
import {
  User, Upload, CheckCircle, AlertCircle, Users, Loader2, RefreshCcw,
  XCircle, Search, Clock, UserCheck, X, ShieldCheck, Eye, Trophy
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { PlayerStatus, Player } from '../types';
import PlayerCard from '../components/PlayerCard';

// Helper to compress images client-side before Base64 encoding
// Reduces 5MB-10MB mobile camera photos down to ~60KB-80KB for instant uploads without crashing the server
const compressImageFile = (file: File, maxWidth = 800, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export default function PlayerRegistration() {
  const store = useAuctionStore();
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [fileData, setFileData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredPlayer, setRegisteredPlayer] = useState<Player | null>(null);

  // Roster Modal States
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterTab, setRosterTab] = useState<'approved' | 'pending'>('approved');
  const [rosterSearch, setRosterSearch] = useState('');
  const [previewCardPlayer, setPreviewCardPlayer] = useState<Player | null>(null);

  const pendingCount = store.players.filter(p => p.status === 'pending').length;
  const approvedCount = store.players.filter(p => p.status === 'not_called' || p.status === 'sold' || p.status === 'unsold').length;

  const filteredRoster = useMemo(() => {
    return store.players.filter((p) => {
      const matchesTab = rosterTab === 'approved' 
        ? (p.status === 'not_called' || p.status === 'sold' || p.status === 'unsold')
        : p.status === 'pending';
      if (!matchesTab) return false;

      if (rosterSearch.trim()) {
        const query = rosterSearch.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesRole = p.role?.toLowerCase().includes(query);
        return Boolean(matchesName || matchesRole);
      }
      return true;
    });
  }, [store.players, rosterTab, rosterSearch]);

  const maskPhoneNumber = (phone?: string) => {
    if (!phone) return '';
    const cleaned = String(phone).trim();
    if (cleaned.length <= 4) return '****';
    return cleaned.slice(0, 3) + '****' + cleaned.slice(-3);
  };

  useEffect(() => {
    loadSchema();
    store.loadState();
  }, []);

  const loadSchema = async () => {
    try {
      const data = await api.getRegistrationSchema();
      setSchema(data);

      // Initialize form data based on schema
      const initialData: Record<string, any> = {};
      data.fields.forEach((f: any) => {
        if (f.type === 'select' && f.options.length > 0) {
          initialData[f.id] = f.options[0]; // Set first option as default
        } else if (f.type === 'checkbox') {
          initialData[f.id] = false;
        } else {
          initialData[f.id] = '';
        }
      });
      setFormData(initialData);
    } catch (err) {
      console.error('Failed to load form schema', err);
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[id];
        return newErrs;
      });
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreviews(prev => ({ ...prev, [id]: url }));

      // Automatically compress image client-side to ~70 KB before converting to Base64
      const compressedData = await compressImageFile(file, 800, 0.8);
      setFileData(prev => ({ ...prev, [id]: compressedData }));

      if (errors[id]) {
        setErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    schema.fields.forEach((field: any) => {
      if (field.required) {
        if (field.type === 'file') {
          if (!filePreviews[field.id]) newErrors[field.id] = `${field.label} is required`;
        } else if (field.type === 'checkbox') {
          if (!formData[field.id]) newErrors[field.id] = `${field.label} must be selected`;
        } else {
          if (!formData[field.id] || String(formData[field.id]).trim() === '') {
            newErrors[field.id] = `${field.label} is required`;
          }
        }
      }

      // specific validation
      if (field.type === 'tel' && formData[field.id]) {
        if (!/^[0-9+() -]{10,15}$/.test(String(formData[field.id]))) {
          newErrors[field.id] = `Valid ${field.label.toLowerCase()} is required`;
        }
      }
      if (field.id === 'age' && formData[field.id]) {
        const ageNum = parseInt(formData[field.id]);
        if (isNaN(ageNum) || ageNum < 5 || ageNum > 80) {
          newErrors[field.id] = `${field.label} must be between 5 and 80`;
        }
      }
    });

    const phoneField = schema.fields.find((f: any) => f.id === 'phone' || f.type === 'tel');
    const emailField = schema.fields.find((f: any) => f.id === 'email' || f.type === 'email');

    const phoneVal = phoneField ? formData[phoneField.id] : null;
    const emailVal = emailField ? formData[emailField.id] : null;

    const isDuplicate = store.players.some(p =>
      (phoneVal && p.phone === phoneVal) ||
      (emailVal && p.email && p.email === emailVal)
    );

    if (isDuplicate) {
      newErrors.duplicate = 'A player with this phone or email is already registered.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {

      const newPlayer: Omit<Player, 'id'> = {
        name: formData.name || formData.fullName || 'Unknown Player',
        phone: formData.phone || formData.contactNumber || 'N/A',
        photo: fileData.photo || fileData[Object.keys(fileData).find(k => k.toLowerCase().includes('photo')) || ''] || '',
        status: 'pending' as PlayerStatus,
        basePrice: store.settings.basePrice,
        ...formData,
      };

      // Add all dynamic file data (Base64) to the payload for persistence
      Object.keys(fileData).forEach(key => {
        (newPlayer as any)[key] = fileData[key];
      });

      store.addPlayer(newPlayer);
      setRegisteredPlayer({ ...newPlayer, id: 'preview' } as Player); // Temporarily store for display
      setIsSuccess(true);

      // Auto-reset after a longer duration (e.g., 10 seconds)
      setTimeout(() => {
        resetForm();
      }, 10000);
    }
  };

  const resetForm = () => {
    setIsSuccess(false);
    setRegisteredPlayer(null);
    const resetData: Record<string, any> = {};
    schema.fields.forEach((f: any) => {
      if (f.type === 'select' && f.options.length > 0) resetData[f.id] = f.options[0];
      else if (f.type === 'checkbox') resetData[f.id] = false;
      else resetData[f.id] = '';
    });
    setFormData(resetData);
    setFilePreviews({});
    setFileData({});
    setErrors({});
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;
  }

  // Split fields into text/select inputs vs file uploads for a better layout
  const fileFields = schema.fields.filter((f: any) => f.type === 'file');
  const otherFields = schema.fields.filter((f: any) => f.type !== 'file');

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* HUGE BACKGROUND WATERMARK */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
        <span className="text-slate-200/60 font-black text-[12rem] md:text-[20rem] leading-none tracking-tighter -rotate-[8deg] select-none whitespace-nowrap">
          AUCTION 47
        </span>
      </div>

      <div className="max-w-5xl mx-auto pb-12 animate-in fade-in relative z-10">
        {/* BRANDED HERO SECTION */}
        <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center gap-8">
            {store.settings.tournamentLogo ? (
              <img
                src={store.settings.tournamentLogo}
                alt="Tournament Logo"
                className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-2xl bg-white/5 p-4 shadow-xl border border-white/10"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-xl">
                <Users size={48} className="text-white/20" />
              </div>
            )}

            <div className="text-center md:text-left flex-1">
              {store.settings.registrationOpen !== false ? (
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Registrations Open
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Registrations Closed
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                {store.settings.tournamentName || 'Tournament Registration'}
              </h1>
              <p className="text-slate-300 text-lg font-medium max-w-2xl">
                Complete the form below to register for the upcoming auction. Ensure all details are accurate.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
              {/* Status Badges */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => { setRosterTab('approved'); setShowRosterModal(true); }}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-center hover:bg-emerald-500/30 transition-all cursor-pointer"
                  title="View Approved Players"
                >
                  <div className="text-2xl font-black text-emerald-300 leading-none">{approvedCount}</div>
                  <div className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-wider mt-1 flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Approved
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setRosterTab('pending'); setShowRosterModal(true); }}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-center hover:bg-amber-500/30 transition-all cursor-pointer"
                  title="View Pending Review Players"
                >
                  <div className="text-2xl font-black text-amber-300 leading-none">{pendingCount}</div>
                  <div className="text-[10px] font-extrabold text-amber-200 uppercase tracking-wider mt-1 flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Pending Review
                  </div>
                </button>
              </div>

              {/* View Roster Button */}
              <button
                type="button"
                onClick={() => setShowRosterModal(true)}
                className="w-full sm:w-auto px-5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] border border-blue-400/40 cursor-pointer"
              >
                <Users size={18} />
                <span>View Registered Players</span>
              </button>
            </div>
          </div>
        </div>

        {/* TOAST NOTIFICATIONS */}
        {(isSuccess || Object.keys(errors).length > 0) && (
          <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4">
            {isSuccess && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center gap-4 shadow-2xl animate-in slide-in-from-right-8 duration-300 max-w-sm">
                <div className="bg-emerald-100 p-2 rounded-full shrink-0">
                  <CheckCircle size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-md font-bold text-emerald-900 leading-tight">Registration Complete!</h3>
                  <p className="text-emerald-700 text-sm font-medium mt-0.5">
                    Profile submitted and pending approval.
                  </p>
                </div>
              </div>
            )}

            {errors.duplicate && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-4 shadow-2xl animate-in slide-in-from-right-8 duration-300 max-w-sm">
                <div className="bg-red-100 p-2 rounded-full shrink-0">
                  <AlertCircle size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-md font-bold text-red-900 leading-tight">Duplicate Found</h3>
                  <p className="text-red-700 text-sm font-medium mt-0.5">
                    {errors.duplicate}
                  </p>
                </div>
              </div>
            )}

            {Object.keys(errors).length > 0 && !errors.duplicate && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-4 shadow-2xl animate-in slide-in-from-right-8 duration-300 max-w-sm">
                <div className="bg-amber-100 p-2 rounded-full shrink-0">
                  <AlertCircle size={24} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-md font-bold text-amber-900 leading-tight">Missing Info</h3>
                  <ul className="list-disc pl-4 mt-2 text-sm font-medium text-amber-700 space-y-1">
                    {Object.entries(errors).map(([key, msg]) => (
                      <li key={key}>{msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {isSuccess && registeredPlayer ? (
          <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
            <h2 className="text-3xl font-black text-slate-800 mb-8 tracking-tight">Player Card Generated</h2>

            <PlayerCard
              player={registeredPlayer}
              schema={schema}
              registrationNumber={store.players.length + 100}
              className="mb-8"
            />

            <button
              onClick={resetForm}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <RefreshCcw size={20} /> Register Another Player
            </button>
          </div>
        ) : store.settings.registrationOpen === false ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center animate-in fade-in duration-300 mt-8">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} className="text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Registrations are Closed</h2>
            <p className="text-slate-500 text-lg max-w-lg mx-auto">
              We are no longer accepting player registrations at this time. If you believe this is an error, please contact the tournament administrators.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300">

            {/* DYNAMIC FORM FIELDS */}
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <User className="text-blue-500" /> Player Information
                </h2>
                <p className="text-slate-500 text-sm mt-1">Please fill out all required details accurately.</p>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {otherFields.map((field: any) => (
                  <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    {field.type !== 'checkbox' && (
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                    )}

                    {field.type === 'select' ? (
                      <select
                        value={formData[field.id]}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border-2 transition-all outline-none font-medium",
                          errors[field.id] ? "border-red-300 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500 hover:border-slate-300"
                        )}
                      >
                        {!formData[field.id] && <option value="" disabled>Select an option...</option>}
                        {field.options.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-slate-200 rounded-xl hover:border-blue-400 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData[field.id]}
                          onChange={e => handleInputChange(field.id, e.target.checked)}
                          className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-slate-700">{field.label} {field.required && <span className="text-red-500">*</span>}</span>
                      </label>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.id]}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        rows={4}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border-2 transition-all outline-none font-medium resize-y",
                          errors[field.id] ? "border-red-300 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500 hover:border-slate-300"
                        )}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.id]}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl border-2 transition-all outline-none font-medium",
                          errors[field.id] ? "border-red-300 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500 hover:border-slate-300"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* DYNAMIC FILE UPLOADS */}
            {fileFields.length > 0 && (
              <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Upload className="text-purple-500" /> Documents & Photos
                  </h2>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {fileFields.map((field: any) => (
                    <div key={field.id} className="space-y-4">
                      <label className="block text-sm font-bold text-slate-700">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <label className={cn(
                        "relative block w-full aspect-[4/3] rounded-2xl border-4 border-dashed cursor-pointer overflow-hidden transition-all group",
                        errors[field.id] ? "border-red-300 bg-red-50 hover:bg-red-100" : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-purple-300"
                      )}>
                        <input
                          type="file"
                          accept={field.accept || ''}
                          onChange={e => handleFileUpload(e, field.id)}
                          className="hidden"
                        />

                        {filePreviews[field.id] ? (
                          <div className="absolute inset-0">
                            {/* Try to show image if it is one, otherwise fallback */}
                            <img src={filePreviews[field.id]} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <p className="text-white font-bold flex items-center gap-2">
                                <Upload size={20} /> Change File
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-100 group-hover:text-purple-600 transition-all">
                              <Upload size={28} />
                            </div>
                            <p className="font-bold text-slate-600">Click to upload</p>
                            {field.accept && <p className="text-sm mt-1">{field.accept}</p>}
                          </div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SUBMIT */}
            <div className="bg-slate-900 rounded-3xl p-8 text-center shadow-xl">
              <h3 className="text-xl font-bold text-white mb-2">Ready to submit?</h3>
              <p className="text-slate-400 mb-6">By continuing, you agree to the tournament registration rules.</p>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-4 px-12 rounded-2xl w-full md:w-auto shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105"
              >
                Submit Application
              </button>
            </div>
          </form>
        )}

        {/* ── PUBLIC REGISTERED PLAYERS ROSTER MODAL ── */}
        {showRosterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                    <Trophy size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-wide">
                      {store.settings.tournamentName || 'Tournament'} Player Roster
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Check registration confirmation and admin review status
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRosterModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="Close Roster"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Controls: Tabs & Live Search */}
              <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
                {/* Tabs */}
                <div className="flex bg-slate-800 p-1 rounded-xl gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRosterTab('approved')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer',
                      rosterTab === 'approved'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    <UserCheck size={14} />
                    <span>Approved</span>
                    <span className="px-1.5 py-0.2 bg-black/30 rounded-full text-[10px] font-mono">
                      {approvedCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRosterTab('pending')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer',
                      rosterTab === 'pending'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    <Clock size={14} />
                    <span>Pending Review</span>
                    <span className="px-1.5 py-0.2 bg-black/30 rounded-full text-[10px] font-mono">
                      {pendingCount}
                    </span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Search by player name or role..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 font-medium"
                  />
                  {rosterSearch && (
                    <button
                      type="button"
                      onClick={() => setRosterSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Roster Grid */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
                {filteredRoster.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center">
                    <ShieldCheck size={48} className="opacity-30 mb-3" />
                    <p className="text-base font-bold text-slate-300">No players found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {rosterSearch ? 'No player matches your search filter.' : rosterTab === 'approved' ? 'No players approved yet. Approved players will appear here.' : 'No players currently pending review.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRoster.map((player) => {
                      const isApproved = player.status === 'not_called' || player.status === 'sold' || player.status === 'unsold';
                      return (
                        <div
                          key={player.id}
                          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center hover:border-slate-700 transition shadow-lg group relative overflow-hidden"
                        >
                          {/* Photo */}
                          <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700 shadow-md">
                            {player.photo ? (
                              <img
                                src={player.photo}
                                alt={player.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-blue-400 font-black text-2xl">
                                {player.name ? player.name.slice(0, 2).toUpperCase() : 'PL'}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            {/* Status Pill */}
                            <div className="mb-1.5 flex items-center gap-1.5">
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Approved for Auction
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  Pending Admin Review
                                </span>
                              )}
                            </div>

                            {/* Name */}
                            <h3 className="font-black text-base text-white uppercase tracking-tight truncate" title={player.name}>
                              {player.name}
                            </h3>

                            {/* Role / Meta */}
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                              {player.role && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                                  {player.role}
                                </span>
                              )}
                              {player.phone && (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {maskPhoneNumber(player.phone)}
                                </span>
                              )}
                            </div>

                            {/* View Card button */}
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => setPreviewCardPlayer(player)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                              >
                                <Eye size={13} />
                                <span>View Official Card</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer Note */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-center text-xs text-slate-500 font-medium">
                🔒 Public View: Phone numbers are masked for privacy. Admin approval is required for auction entry.
              </div>
            </div>
          </div>
        )}

        {/* ── OFFICIAL CARD PREVIEW MODAL ── */}
        {previewCardPlayer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative max-w-4xl w-full flex flex-col items-center">
              <button
                type="button"
                onClick={() => setPreviewCardPlayer(null)}
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer"
                title="Close Card"
              >
                <X size={20} />
              </button>

              <PlayerCard
                player={previewCardPlayer}
                schema={schema}
                registrationNumber={store.players.findIndex(p => p.id === previewCardPlayer.id) + 101}
                className="shadow-2xl"
              />
            </div>
          </div>
        )}

        {/* Promotional Footer */}
        <div className="mt-16 text-center flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-300">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Powered By</p>
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text font-black text-3xl tracking-tighter drop-shadow-sm">
              AUCTION 47
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-2 font-medium max-w-sm">
            The ultimate platform for professional sports auctions and tournament management.
          </p>
          <a href="mailto:auction047@gmail.com" className="text-indigo-600 font-mono mt-3 hover:text-purple-600 hover:underline transition-colors font-bold flex items-center gap-2">
            Support: auction047@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
