import { useState } from 'react';
import { useAuctionStore } from '../store/useAuctionStore';
import { Save, Plus, Trash2, AlertTriangle, StopCircle, PlayCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const store = useAuctionStore();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(store.settings);
  const [showEndModal, setShowEndModal] = useState(false);

  const confirmEndAuction = () => {
    store.endAuction();
    setShowEndModal(false);
    navigate('/');
  };

  const handleSave = () => {
    store.updateSettings(settings);
    alert('Settings saved successfully!');
  };

  const updateIncrement = (index: number, field: string, value: number) => {
    const newInc = [...settings.increments];
    newInc[index] = { ...newInc[index], [field]: value };
    setSettings({ ...settings, increments: newInc });
  };

  const addIncrement = () => {
    setSettings({
      ...settings,
      increments: [...settings.increments, { upTo: 50000, increment: 1000 }]
    });
  };

  const removeIncrement = (index: number) => {
    setSettings({
      ...settings,
      increments: settings.increments.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Auction Rules & Settings</h2>
          <p className="text-slate-500 text-sm mt-1">Configure the core logic and parameters for the live auction.</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Global Parameters</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teams Limit</label>
            <input 
              type="number" 
              value={settings.numTeams}
              onChange={(e) => setSettings({...settings, numTeams: parseInt(e.target.value) || 0})}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Default Team Budget</label>
            <input 
              type="number" 
              value={settings.initialBudget}
              onChange={(e) => setSettings({...settings, initialBudget: parseInt(e.target.value) || 0})}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none" 
            />
            <p className="text-xs text-slate-500 mt-1">Example: {formatCurrency(settings.initialBudget)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Squad Size</label>
              <input 
                type="number" 
                value={settings.minPlayers}
                onChange={(e) => setSettings({...settings, minPlayers: parseInt(e.target.value) || 0})}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Squad Size</label>
              <input 
                type="number" 
                value={settings.maxPlayers}
                onChange={(e) => setSettings({...settings, maxPlayers: parseInt(e.target.value) || 0})}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Global Base Price</label>
            <input 
              type="number" 
              value={settings.basePrice}
              onChange={(e) => setSettings({...settings, basePrice: parseInt(e.target.value) || 0})}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none" 
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-semibold text-slate-900">Bid Increments</h3>
            <button onClick={addIncrement} className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium">
              <Plus size={16} /> Add Rule
            </button>
          </div>
          
          <p className="text-sm text-slate-500">Define how the bid increases based on the current bid amount. Use a very large number for the upper bound (e.g. 99999999).</p>

          <div className="space-y-3 mt-4">
            {settings.increments.map((inc, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Up To Bid Amount</label>
                  <input 
                    type="number" 
                    value={inc.upTo === Infinity ? 9999999 : inc.upTo}
                    onChange={(e) => updateIncrement(idx, 'upTo', parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Increment By</label>
                  <input 
                    type="number" 
                    value={inc.increment}
                    onChange={(e) => updateIncrement(idx, 'increment', parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                  />
                </div>
                <button 
                  onClick={() => removeIncrement(idx)}
                  className="mt-5 p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AUCTION LIFECYCLE CONTROLS */}
      <div className="mt-8 pt-8 border-t border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-500" /> Auction Lifecycle
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h4 className="font-bold text-red-900 text-lg">Status:</h4>
              <span className={`px-2.5 py-0.5 rounded-md text-sm font-bold uppercase
                ${store.status === 'setup' ? 'bg-slate-200 text-slate-700' :
                  store.status === 'completed' ? 'bg-purple-200 text-purple-800' :
                  'bg-green-200 text-green-800'}`}>
                {store.status}
              </span>
            </div>
            <p className="text-red-700 text-sm mt-1 max-w-lg">
              Changing the auction state is permanent. Ensure all teams and rules are set up before starting. Ending an auction locks it forever.
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            {store.status === 'setup' && (
              <button 
                onClick={() => { store.startAuction(); navigate('/auction'); }} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
              >
                <PlayCircle size={20} /> Start Auction
              </button>
            )}
            {store.status !== 'completed' && store.status !== 'setup' && (
              <button 
                onClick={() => setShowEndModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
              >
                <StopCircle size={20} /> End Auction
              </button>
            )}
          </div>
        </div>
      </div>

      {/* END AUCTION MODAL */}
      {showEndModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">End This Auction?</h2>
              <p className="text-slate-600 text-sm mb-6 font-medium">
                Are you absolutely sure? Once you end the tournament, bidding will be permanently locked and no further changes can be made.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmEndAuction}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
                >
                  <StopCircle size={20} />
                  Yes, End the Auction
                </button>
                <button 
                  onClick={() => setShowEndModal(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
