import React from 'react';
import type { CanvasElement } from '../../types/editor';
import { Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react';

interface TransformHandlesProps {
  element: CanvasElement;
  onResizeStart: (e: React.PointerEvent, handle: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
}

export const TransformHandles: React.FC<TransformHandlesProps> = ({
  element,
  onResizeStart,
  onDelete,
  onDuplicate,
  onBringForward,
  onSendBackward,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none border-2 border-amber-400 ring-1 ring-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
      {/* Floating Action Bar */}
      <div
        className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg shadow-2xl pointer-events-auto z-50 whitespace-nowrap"
      >
        <button
          onClick={(e) => { e.stopPropagation(); onBringForward(element.id); }}
          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition"
          title="Bring Forward"
        >
          <ArrowUp size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSendBackward(element.id); }}
          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition"
          title="Send Backward"
        >
          <ArrowDown size={13} />
        </button>
        <div className="w-px h-3 bg-slate-700 mx-0.5" />
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(element.id); }}
          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition"
          title="Duplicate Element"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
          className="p-1 hover:bg-red-950/60 text-red-400 hover:text-red-300 rounded transition"
          title="Delete Element"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Corner Handles */}
      <div
        onPointerDown={(e) => onResizeStart(e, 'nw')}
        className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-amber-500 rounded-sm cursor-nwse-resize pointer-events-auto shadow-md"
      />
      <div
        onPointerDown={(e) => onResizeStart(e, 'ne')}
        className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-amber-500 rounded-sm cursor-nesw-resize pointer-events-auto shadow-md"
      />
      <div
        onPointerDown={(e) => onResizeStart(e, 'sw')}
        className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-amber-500 rounded-sm cursor-nesw-resize pointer-events-auto shadow-md"
      />
      <div
        onPointerDown={(e) => onResizeStart(e, 'se')}
        className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-amber-500 rounded-sm cursor-nwse-resize pointer-events-auto shadow-md"
      />

      {/* Edge Midpoint Handles */}
      <div
        onPointerDown={(e) => onResizeStart(e, 'n')}
        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border border-amber-500 rounded-full cursor-ns-resize pointer-events-auto shadow-sm"
      />
      <div
        onPointerDown={(e) => onResizeStart(e, 's')}
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border border-amber-500 rounded-full cursor-ns-resize pointer-events-auto shadow-sm"
      />
      <div
        onPointerDown={(e) => onResizeStart(e, 'w')}
        className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border border-amber-500 rounded-full cursor-ew-resize pointer-events-auto shadow-sm"
      />
      <div
        onPointerDown={(e) => onResizeStart(e, 'e')}
        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border border-amber-500 rounded-full cursor-ew-resize pointer-events-auto shadow-sm"
      />
    </div>
  );
};
