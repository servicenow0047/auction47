import React from 'react';
import type {
  CanvasElement,
  TextElement,
  ImageElement,
  BadgeElement,
  PlayerGridElement,
  EditorBackground,
} from '../../types/editor';
import {
  Type,
  Image as ImageIcon,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Sliders,
  Check,
} from 'lucide-react';

interface EditorPropertyPanelProps {
  selectedElement: CanvasElement | null;
  background: EditorBackground;
  onUpdateElement: (updated: Partial<CanvasElement>) => void;
  onUpdateBackground: (updated: Partial<EditorBackground>) => void;
  onAddText: (preset?: 'heading' | 'subheading' | 'ribbon' | 'watermark') => void;
  onAddImage: (file: File) => void;
  onCustomBackgroundUpload: (file: File) => void;
}

const PRESET_BACKGROUNDS = [
  { id: 'stadium-night', label: 'Stadium Night (Ref)', bgClass: 'from-blue-950 via-slate-900 to-black' },
  { id: 'stadium-gold', label: 'Stadium Gold', bgClass: 'from-amber-950 via-blue-950 to-slate-950' },
  { id: 'electric-blue', label: 'Electric Blue', bgClass: 'from-sky-900 via-blue-950 to-slate-950' },
  { id: 'dark-arena', label: 'Dark Arena', bgClass: 'from-slate-800 via-slate-900 to-black' },
  { id: 'carbon-luxury', label: 'Carbon Luxury', bgClass: 'from-neutral-900 via-neutral-950 to-black' },
] as const;

const FONT_FAMILIES = [
  { id: 'Impact, sans-serif', label: 'Impact (3D Gold)' },
  { id: 'Arial Black, sans-serif', label: 'Arial Black (Heavy)' },
  { id: 'Inter, sans-serif', label: 'Inter (Modern Sans)' },
  { id: 'Georgia, serif', label: 'Georgia (Classic)' },
  { id: 'monospace', label: 'Monospace' },
];

export const EditorPropertyPanel: React.FC<EditorPropertyPanelProps> = ({
  selectedElement,
  background,
  onUpdateElement,
  onUpdateBackground,
  onAddText,
  onAddImage,
  onCustomBackgroundUpload,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bgInputRef = React.useRef<HTMLInputElement>(null);

  // If no element is selected, show Canvas / Background and Add Tools
  if (!selectedElement) {
    return (
      <div className="p-4 space-y-6 text-slate-200">
        {/* Quick Add Elements */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Add Elements
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAddText('heading')}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs transition"
            >
              <Type size={14} /> + Heading
            </button>
            <button
              onClick={() => onAddText('ribbon')}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-xs transition"
            >
              <Plus size={14} /> + Ribbon Badge
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition"
            >
              <ImageIcon size={15} /> + Add Image / Logo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAddImage(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {/* Background Presets */}
        <div className="pt-4 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Canvas Background
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => onUpdateBackground({ preset: bg.id })}
                className={`h-16 rounded-xl border p-2 text-left flex flex-col justify-between transition relative overflow-hidden bg-gradient-to-br ${bg.bgClass} ${
                  background.preset === bg.id
                    ? 'border-amber-500 ring-2 ring-amber-500/30'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                <span className="text-[11px] font-bold text-white relative z-10">{bg.label}</span>
                {background.preset === bg.id && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-black rounded-full flex items-center justify-center text-[10px]">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Upload Custom Wallpaper / BG */}
          <div className="mt-3">
            <button
              onClick={() => bgInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-700 hover:border-amber-500 bg-slate-800/40 text-xs text-slate-300 hover:text-white transition"
            >
              <Upload size={14} className="text-amber-400" /> Upload Custom Background
            </button>
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onCustomBackgroundUpload(f);
                e.target.value = '';
              }}
            />
          </div>

          {/* Darkness slider */}
          <div className="mt-4">
            <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
              <span>Darkness Overlay</span>
              <span className="font-mono">{background.darkness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              value={background.darkness}
              onChange={(e) => onUpdateBackground({ darkness: parseInt(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-400">
          💡 Click any text, logo, or player card on the poster to drag, resize, change color, or edit details.
        </div>
      </div>
    );
  }

  // Element is selected: Show element-specific property inspector
  return (
    <div className="p-4 space-y-5 text-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-amber-400" />
          <h3 className="font-bold text-sm uppercase tracking-wide text-white">
            Edit {selectedElement.type.replace('-', ' ')}
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {Math.round(selectedElement.width)} × {Math.round(selectedElement.height)}px
        </span>
      </div>

      {/* ── TEXT ELEMENT CONTROLS ── */}
      {selectedElement.type === 'text' && (
        <TextControls textEl={selectedElement} onUpdate={onUpdateElement} />
      )}

      {/* ── IMAGE ELEMENT CONTROLS ── */}
      {selectedElement.type === 'image' && (
        <ImageControls imgEl={selectedElement} onUpdate={onUpdateElement} />
      )}

      {/* ── BADGE ELEMENT CONTROLS ── */}
      {selectedElement.type === 'badge' && (
        <BadgeControls badgeEl={selectedElement} onUpdate={onUpdateElement} />
      )}

      {/* ── PLAYER GRID CONTROLS ── */}
      {selectedElement.type === 'player-grid' && (
        <PlayerGridControls gridEl={selectedElement} onUpdate={onUpdateElement} />
      )}
    </div>
  );
};

// ── SUB-CONTROLLERS ──────────────────────────────────────────────────────────

function TextControls({
  textEl,
  onUpdate,
}: {
  textEl: TextElement;
  onUpdate: (u: Partial<TextElement>) => void;
}) {
  return (
    <div className="space-y-4 text-xs">
      {/* Content */}
      <div>
        <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Text Content</label>
        <textarea
          rows={2}
          value={textEl.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium outline-none focus:border-amber-500"
        />
      </div>

      {/* Style Effect */}
      <div>
        <label className="text-slate-400 font-bold uppercase tracking-wider block mb-2">Style Effect</label>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: 'gold-3d', label: '3D Gold' },
              { id: 'metallic-silver', label: 'Silver Metal' },
              { id: 'red-ribbon', label: 'Crimson' },
              { id: 'flat', label: 'Flat Color' },
            ] as const
          ).map((eff) => (
            <button
              key={eff.id}
              onClick={() => onUpdate({ styleEffect: eff.id })}
              className={`p-2 rounded-lg border text-left font-bold transition ${
                textEl.styleEffect === eff.id
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              {eff.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <div className="flex justify-between items-center text-slate-400 mb-1">
          <span className="font-bold uppercase tracking-wider">Font Size</span>
          <span className="font-mono text-white font-bold">{textEl.fontSize}px</span>
        </div>
        <input
          type="range"
          min="10"
          max="120"
          value={textEl.fontSize}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
          className="w-full accent-amber-500"
        />
      </div>

      {/* Font Family */}
      <div>
        <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Font Family</label>
        <select
          value={textEl.fontFamily}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white outline-none focus:border-amber-500"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Color & Alignment */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textEl.color || '#FFFFFF'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-slate-700"
            />
            <span className="font-mono text-slate-300 uppercase">{textEl.color}</span>
          </div>
        </div>

        <div>
          <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Align</label>
          <div className="flex rounded-lg border border-slate-700 bg-slate-800 overflow-hidden">
            <button
              onClick={() => onUpdate({ textAlign: 'left' })}
              className={`flex-1 py-1.5 flex items-center justify-center ${textEl.textAlign === 'left' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => onUpdate({ textAlign: 'center' })}
              className={`flex-1 py-1.5 flex items-center justify-center ${textEl.textAlign === 'center' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => onUpdate({ textAlign: 'right' })}
              className={`flex-1 py-1.5 flex items-center justify-center ${textEl.textAlign === 'right' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
            >
              <AlignRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageControls({
  imgEl,
  onUpdate,
}: {
  imgEl: ImageElement;
  onUpdate: (u: Partial<ImageElement>) => void;
}) {
  const replaceInputRef = React.useRef<HTMLInputElement>(null);

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({ src: reader.result as string });
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 text-xs">
      <button
        onClick={() => replaceInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold transition"
      >
        <Upload size={14} /> Replace Image / Logo
      </button>
      <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={handleReplace} />

      {/* Circular & Border */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <label className="flex items-center justify-between text-slate-300 cursor-pointer">
          <span>Circular Shape</span>
          <input
            type="checkbox"
            checked={imgEl.isCircular}
            onChange={(e) => onUpdate({ isCircular: e.target.checked })}
            className="accent-amber-500"
          />
        </label>
        {!imgEl.isCircular && (
          <div>
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span>Corner Radius</span>
              <span className="font-mono">{imgEl.borderRadius || 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={imgEl.borderRadius || 0}
              onChange={(e) => onUpdate({ borderRadius: parseInt(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>
        )}
      </div>

      {/* Opacity */}
      <div>
        <div className="flex justify-between items-center text-slate-400 mb-1">
          <span>Opacity</span>
          <span className="font-mono">{Math.round((imgEl.opacity ?? 1) * 100)}%</span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          value={Math.round((imgEl.opacity ?? 1) * 100)}
          onChange={(e) => onUpdate({ opacity: parseInt(e.target.value) / 100 })}
          className="w-full accent-amber-500"
        />
      </div>
    </div>
  );
}

function BadgeControls({
  badgeEl,
  onUpdate,
}: {
  badgeEl: BadgeElement;
  onUpdate: (u: Partial<BadgeElement>) => void;
}) {
  return (
    <div className="space-y-4 text-xs">
      <div>
        <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Badge Text</label>
        <input
          type="text"
          value={badgeEl.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-bold outline-none focus:border-amber-500"
        />
      </div>

      <div>
        <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Badge Type</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onUpdate({ badgeType: 'dates' })}
            className={`p-2 rounded-lg border font-bold ${badgeEl.badgeType === 'dates' ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
          >
            Crimson Ribbon
          </button>
          <button
            onClick={() => onUpdate({ badgeType: 'venue' })}
            className={`p-2 rounded-lg border font-bold ${badgeEl.badgeType === 'venue' ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
          >
            Location Pill
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center text-slate-400 mb-1">
          <span>Font Size</span>
          <span className="font-mono">{badgeEl.fontSize}px</span>
        </div>
        <input
          type="range"
          min="10"
          max="30"
          value={badgeEl.fontSize}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
          className="w-full accent-amber-500"
        />
      </div>
    </div>
  );
}

function PlayerGridControls({
  gridEl,
  onUpdate,
}: {
  gridEl: PlayerGridElement;
  onUpdate: (u: Partial<PlayerGridElement>) => void;
}) {
  return (
    <div className="space-y-4 text-xs">
      <div>
        <label className="text-slate-400 font-bold uppercase tracking-wider block mb-2">Grid Columns</label>
        <div className="grid grid-cols-4 gap-2">
          {([3, 4, 5, 6] as const).map((cols) => (
            <button
              key={cols}
              onClick={() => onUpdate({ columns: cols })}
              className={`py-2 rounded-lg font-bold border transition ${
                gridEl.columns === cols
                  ? 'bg-amber-500 text-black border-amber-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              {cols} Cols
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center text-slate-400 mb-1">
          <span>Card Corner Rounding</span>
          <span className="font-mono">{gridEl.cardRadius}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="28"
          value={gridEl.cardRadius}
          onChange={(e) => onUpdate({ cardRadius: parseInt(e.target.value) })}
          className="w-full accent-amber-500"
        />
      </div>

      <div>
        <label className="text-slate-400 font-bold uppercase tracking-wider block mb-2">Photo Aspect</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onUpdate({ photoAspectRatio: 'square' })}
            className={`py-2 rounded-lg font-bold border transition ${gridEl.photoAspectRatio === 'square' ? 'bg-amber-500 text-black border-amber-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
          >
            Square (1:1)
          </button>
          <button
            onClick={() => onUpdate({ photoAspectRatio: 'portrait' })}
            className={`py-2 rounded-lg font-bold border transition ${gridEl.photoAspectRatio === 'portrait' ? 'bg-amber-500 text-black border-amber-500' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
          >
            Portrait (3:4)
          </button>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 space-y-2">
        <label className="flex items-center justify-between text-slate-300 cursor-pointer">
          <span>Show Player Role Badge</span>
          <input
            type="checkbox"
            checked={gridEl.showRole}
            onChange={(e) => onUpdate({ showRole: e.target.checked })}
            className="accent-amber-500"
          />
        </label>
        <label className="flex items-center justify-between text-slate-300 cursor-pointer">
          <span>Show Auction Price Badge</span>
          <input
            type="checkbox"
            checked={gridEl.showPrice}
            onChange={(e) => onUpdate({ showPrice: e.target.checked })}
            className="accent-amber-500"
          />
        </label>
      </div>
    </div>
  );
}
