import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Save, Plus, Trash2, GripVertical, FileImage, Type, AlignLeft, Hash, CheckSquare, Mail, Phone, List as ListIcon, Loader2, AlertTriangle, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  builtIn: boolean;
  options: string[];
  accept: string;
  placeholder: string;
  order: number;
}

interface FormSchema {
  sportName: string;
  fields: FormField[];
}

const templates: Record<string, FormField[]> = {
  Cricket: [
    { id: 'name', label: 'Full Name', type: 'text', required: true, builtIn: true, order: 1, options: [], accept: '', placeholder: '' },
    { id: 'age', label: 'Age', type: 'number', required: true, builtIn: true, order: 2, options: [], accept: '', placeholder: '' },
    { id: 'phone', label: 'Phone Number', type: 'tel', required: true, builtIn: true, order: 3, options: [], accept: '', placeholder: '' },
    { id: 'email', label: 'Email Address', type: 'email', required: false, builtIn: false, order: 4, options: [], accept: '', placeholder: '' },
    { id: 'role', label: 'Role', type: 'select', required: true, builtIn: true, options: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'], order: 5, accept: '', placeholder: '' },
    { id: 'battingStyle', label: 'Batting Style', type: 'select', required: false, builtIn: true, options: ['Right-hand bat', 'Left-hand bat'], order: 6, accept: '', placeholder: '' },
    { id: 'bowlingStyle', label: 'Bowling Style', type: 'select', required: false, builtIn: true, options: ['None', 'Right-arm fast', 'Right-arm medium', 'Right-arm offbreak', 'Right-arm legbreak', 'Left-arm fast', 'Left-arm orthodox', 'Left-arm chinaman'], order: 7, accept: '', placeholder: '' },
    { id: 'experience', label: 'Experience Level', type: 'select', required: false, builtIn: false, options: ['Beginner', 'Intermediate', 'Professional'], order: 8, accept: '', placeholder: '' },
    { id: 'previousTeam', label: 'Previous Team (if any)', type: 'text', required: false, builtIn: false, order: 9, options: [], accept: '', placeholder: '' },
    { id: 'photo', label: 'Player Photo', type: 'file', required: true, builtIn: true, accept: 'image/*', order: 10, options: [], placeholder: '' },
    { id: 'idProof', label: 'ID Proof (Aadhar/Passport)', type: 'file', required: false, builtIn: false, accept: 'image/*,.pdf', order: 11, options: [], placeholder: '' },
  ],
  Football: [
    { id: 'name', label: 'Full Name', type: 'text', required: true, builtIn: true, order: 1, options: [], accept: '', placeholder: '' },
    { id: 'age', label: 'Age', type: 'number', required: true, builtIn: true, order: 2, options: [], accept: '', placeholder: '' },
    { id: 'phone', label: 'Phone Number', type: 'tel', required: true, builtIn: true, order: 3, options: [], accept: '', placeholder: '' },
    { id: 'email', label: 'Email Address', type: 'email', required: false, builtIn: false, order: 4, options: [], accept: '', placeholder: '' },
    { id: 'position', label: 'Position', type: 'select', required: true, builtIn: false, options: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'], order: 5, accept: '', placeholder: '' },
    { id: 'preferredFoot', label: 'Preferred Foot', type: 'select', required: true, builtIn: false, options: ['Right', 'Left', 'Both'], order: 6, accept: '', placeholder: '' },
    { id: 'jerseyNumber', label: 'Preferred Jersey Number', type: 'number', required: false, builtIn: false, order: 7, options: [], accept: '', placeholder: '' },
    { id: 'previousClub', label: 'Previous Club', type: 'text', required: false, builtIn: false, order: 8, options: [], accept: '', placeholder: '' },
    { id: 'photo', label: 'Player Photo', type: 'file', required: true, builtIn: true, accept: 'image/*', order: 10, options: [], placeholder: '' },
    { id: 'idProof', label: 'ID Proof', type: 'file', required: false, builtIn: false, accept: 'image/*,.pdf', order: 11, options: [], placeholder: '' },
  ],
  Basketball: [
    { id: 'name', label: 'Full Name', type: 'text', required: true, builtIn: true, order: 1, options: [], accept: '', placeholder: '' },
    { id: 'age', label: 'Age', type: 'number', required: true, builtIn: true, order: 2, options: [], accept: '', placeholder: '' },
    { id: 'phone', label: 'Phone Number', type: 'tel', required: true, builtIn: true, order: 3, options: [], accept: '', placeholder: '' },
    { id: 'email', label: 'Email Address', type: 'email', required: false, builtIn: false, order: 4, options: [], accept: '', placeholder: '' },
    { id: 'position', label: 'Position', type: 'select', required: true, builtIn: false, options: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'], order: 5, accept: '', placeholder: '' },
    { id: 'height', label: 'Height (cm)', type: 'number', required: true, builtIn: false, order: 6, options: [], accept: '', placeholder: '' },
    { id: 'jerseyNumber', label: 'Jersey Number', type: 'number', required: false, builtIn: false, order: 7, options: [], accept: '', placeholder: '' },
    { id: 'photo', label: 'Player Photo', type: 'file', required: true, builtIn: true, accept: 'image/*', order: 10, options: [], placeholder: '' },
  ],
  Custom: [
    { id: 'name', label: 'Full Name', type: 'text', required: true, builtIn: true, order: 1, options: [], accept: '', placeholder: '' },
    { id: 'phone', label: 'Phone Number', type: 'tel', required: true, builtIn: true, order: 2, options: [], accept: '', placeholder: '' },
    { id: 'photo', label: 'Player Photo', type: 'file', required: true, builtIn: true, accept: 'image/*', order: 3, options: [], placeholder: '' },
  ]
};

const defaultField: FormField = {
  id: '',
  label: 'New Field',
  type: 'text',
  required: false,
  builtIn: false,
  options: ['Option 1', 'Option 2'],
  accept: '',
  placeholder: '',
  order: 99
};

const getIconForType = (type: string) => {
  switch (type) {
    case 'text': return <Type size={16} />;
    case 'number': return <Hash size={16} />;
    case 'email': return <Mail size={16} />;
    case 'tel': return <Phone size={16} />;
    case 'select': return <ListIcon size={16} />;
    case 'file': return <FileImage size={16} />;
    case 'checkbox': return <CheckSquare size={16} />;
    case 'textarea': return <AlignLeft size={16} />;
    default: return <Type size={16} />;
  }
};

export default function FormBuilder() {
  const [schema, setSchema] = useState<FormSchema>({ sportName: 'Cricket', fields: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    try {
      const data = await api.getRegistrationSchema();
      // Ensure arrays are initialized if missing from older records
      const sanitizedFields = data.fields.map((f: any) => ({
        ...f,
        options: f.options || [],
        accept: f.accept || '',
        placeholder: f.placeholder || ''
      }));
      data.fields = sanitizedFields.sort((a: any, b: any) => a.order - b.order);
      setSchema(data);
      if (data.fields.length > 0) setSelectedFieldId(data.fields[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // update order based on array position before saving
      const updatedFields = schema.fields.map((f, i) => ({ ...f, order: i + 1 }));
      await api.updateRegistrationSchema({ sportName: schema.sportName, fields: updatedFields });
      alert('Form Schema saved successfully! The registration page is now updated.');
    } catch (err) {
      alert('Failed to save schema');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin + '/register';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy', err);
      alert('Failed to copy the link. URL is: ' + url);
    });
  };

  const loadTemplate = (sport: string) => {
    if (window.confirm(`Are you sure you want to load the ${sport} template? This will replace your current fields.`)) {
      setSchema({ sportName: sport, fields: JSON.parse(JSON.stringify(templates[sport])) });
      setSelectedFieldId(templates[sport][0].id);
    }
  };

  const addField = () => {
    const newId = 'field_' + Math.random().toString(36).substring(2, 9);
    const newField = { ...defaultField, id: newId, order: schema.fields.length + 1 };
    setSchema(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setSelectedFieldId(newId);
  };

  const removeField = (id: string) => {
    const field = schema.fields.find(f => f.id === id);
    if (field?.builtIn) {
      alert('Cannot delete built-in fields. You can just make them not required.');
      return;
    }
    setSchema(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setSchema(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...schema.fields];
    if (direction === 'up' && index > 0) {
      const temp = newFields[index - 1];
      newFields[index - 1] = newFields[index];
      newFields[index] = temp;
    } else if (direction === 'down' && index < newFields.length - 1) {
      const temp = newFields[index + 1];
      newFields[index + 1] = newFields[index];
      newFields[index] = temp;
    }
    setSchema({ ...schema, fields: newFields });
  };

  const currentField = schema.fields.find(f => f.id === selectedFieldId);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex justify-between items-end mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ListIcon className="text-purple-600" /> Dynamic Form Builder
          </h1>
          <p className="text-slate-500 mt-1">Customize the fields required during player registration.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleCopyLink} className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl transition-all flex items-center gap-2">
            <Share2 size={18} />
            {copied ? 'Copied!' : 'Share Link'}
          </button>
          <button onClick={() => navigate('/register')} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">
            Preview Form
          </button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save & Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: SPORTS PRESETS */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Templates</h2>
            <div className="space-y-2">
              {Object.keys(templates).map(sport => (
                <button
                  key={sport}
                  onClick={() => loadTemplate(sport)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex justify-between items-center ${schema.sportName === sport ? 'border-purple-500 bg-purple-50 text-purple-900 font-bold' : 'border-slate-100 hover:border-slate-300 text-slate-700 font-medium'}`}
                >
                  {sport}
                  {schema.sportName === sport && <CheckSquare size={16} className="text-purple-600" />}
                </button>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm border border-yellow-200">
                <AlertTriangle size={16} className="mb-2 text-yellow-600" />
                <p className="font-semibold">Warning</p>
                Changing the form schema or removing fields might affect previously registered players if the fields no longer exist.
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: FIELD LIST */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-slate-700">Form Layout</h2>
              <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2.5 py-1 rounded-full">{schema.fields.length} Fields</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {schema.fields.map((field, idx) => (
                <div 
                  key={field.id}
                  onClick={() => setSelectedFieldId(field.id)}
                  className={`group flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedFieldId === field.id ? 'border-purple-500 bg-purple-50 shadow-sm' : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                >
                  <div className="flex flex-col gap-1 text-slate-300 hover:text-slate-500 transition-colors">
                    <button onClick={(e) => { e.stopPropagation(); moveField(idx, 'up'); }} disabled={idx === 0} className="disabled:opacity-30 p-1 hover:bg-slate-200 rounded">
                      <GripVertical size={14} className="-mt-1 -mb-2" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); moveField(idx, 'down'); }} disabled={idx === schema.fields.length - 1} className="disabled:opacity-30 p-1 hover:bg-slate-200 rounded">
                      <GripVertical size={14} className="-mt-2 -mb-1" />
                    </button>
                  </div>
                  
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedFieldId === field.id ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                    {getIconForType(field.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold truncate ${selectedFieldId === field.id ? 'text-purple-900' : 'text-slate-700'}`}>{field.label}</p>
                      {field.required && <span className="text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-100 px-1.5 py-0.5 rounded">Req</span>}
                    </div>
                    <p className="text-xs text-slate-500 capitalize">{field.type} {field.options.length > 0 ? `(${field.options.length} options)` : ''}</p>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                    className={`p-2 rounded-lg transition-colors ${field.builtIn ? 'opacity-20 cursor-not-allowed' : 'text-slate-400 hover:bg-red-100 hover:text-red-600'}`}
                    disabled={field.builtIn}
                    title={field.builtIn ? "Built-in fields cannot be deleted" : "Delete field"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={addField}
                className="w-full mt-4 py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-600 font-bold transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add New Field
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: EDITOR */}
        <div className="lg:col-span-4 space-y-4">
          {currentField ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in slide-in-from-right-4">
              <h2 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">Edit Field</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Field Label / Question</label>
                  <input 
                    type="text" 
                    value={currentField.label}
                    onChange={(e) => updateField(currentField.id, { label: e.target.value })}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:border-purple-500 focus:ring-0 outline-none transition-colors font-medium text-slate-900"
                  />
                </div>

                {!currentField.builtIn && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Field Type</label>
                    <select 
                      value={currentField.type}
                      onChange={(e) => updateField(currentField.id, { type: e.target.value })}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:border-purple-500 outline-none transition-colors font-medium text-slate-900"
                    >
                      <option value="text">Short Text</option>
                      <option value="textarea">Long Text</option>
                      <option value="number">Number</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                      <option value="select">Dropdown (Select)</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="file">File Upload (Image/PDF)</option>
                    </select>
                  </div>
                )}
                {currentField.builtIn && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-600">
                    This is a <span className="font-bold text-slate-900">built-in {currentField.type} field</span> and its core type cannot be changed.
                  </div>
                )}

                <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-100 bg-slate-50 cursor-pointer hover:border-purple-200 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={currentField.required}
                    onChange={(e) => updateField(currentField.id, { required: e.target.checked })}
                    className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 leading-tight">Required Field</span>
                    <span className="text-xs text-slate-500">Must be filled before saving</span>
                  </div>
                </label>

                {currentField.type === 'select' && (
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Dropdown Options</label>
                    <div className="space-y-2 mb-3">
                      {currentField.options.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input 
                            type="text" 
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...currentField.options];
                              newOpts[i] = e.target.value;
                              updateField(currentField.id, { options: newOpts });
                            }}
                            className="flex-1 border-2 border-slate-200 rounded-lg px-3 py-1.5 focus:border-purple-500 outline-none text-sm"
                          />
                          <button onClick={() => {
                            const newOpts = [...currentField.options];
                            newOpts.splice(i, 1);
                            updateField(currentField.id, { options: newOpts });
                          }} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => updateField(currentField.id, { options: [...currentField.options, `Option ${currentField.options.length + 1}`] })}
                      className="text-sm font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      <Plus size={16} /> Add Option
                    </button>
                  </div>
                )}

                {currentField.type === 'file' && (
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Accepted File Types</label>
                    <input 
                      type="text" 
                      value={currentField.accept || ''}
                      onChange={(e) => updateField(currentField.id, { accept: e.target.value })}
                      placeholder="e.g. image/*, .pdf"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:border-purple-500 outline-none transition-colors text-sm text-slate-900"
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave blank to accept any file. For images use <code className="bg-slate-100 px-1 rounded">image/*</code>.</p>
                  </div>
                )}
                
                {['text', 'number', 'email', 'tel'].includes(currentField.type) && (
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Placeholder Text</label>
                    <input 
                      type="text" 
                      value={currentField.placeholder || ''}
                      onChange={(e) => updateField(currentField.id, { placeholder: e.target.value })}
                      placeholder="e.g. Enter value..."
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:border-purple-500 outline-none transition-colors text-sm text-slate-900"
                    />
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center text-slate-400 h-[calc(100vh-12rem)]">
              <AlertTriangle size={48} className="mb-4 text-slate-300" />
              <p className="font-bold text-slate-500">No Field Selected</p>
              <p className="text-sm mt-1 max-w-xs">Select a field from the layout list to edit its properties, or add a new field.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
