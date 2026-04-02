import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuctionStore } from '../store/useAuctionStore';
import { api } from '../lib/api';
import { User, Upload, CheckCircle, AlertCircle, Users, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { PlayerStatus, Player } from '../types';
import { Link } from 'react-router-dom';

export default function PlayerRegistration() {
  const store = useAuctionStore();
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [fileData, setFileData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    loadSchema();
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

  const registeredCount = store.players.length;

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

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreviews(prev => ({ ...prev, [id]: url }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(prev => ({ ...prev, [id]: reader.result as string }));
      };
      reader.readAsDataURL(file);

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
      setIsSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setIsSuccess(false);
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
      }, 4000);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;
  }

  // Split fields into text/select inputs vs file uploads for a better layout
  const fileFields = schema.fields.filter((f: any) => f.type === 'file');
  const otherFields = schema.fields.filter((f: any) => f.type !== 'file');

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto pb-12 animate-in fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Player Registration</h1>
          <p className="text-slate-500 mt-2 font-medium">Register for the upcoming auction.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm">
            <Users size={20} className="text-emerald-500" />
            <span>{registeredCount} Registered</span>
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

      <form onSubmit={handleSubmit} className="space-y-8">
        
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
    </div>
    </div>
  );
}
