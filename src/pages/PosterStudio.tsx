import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuctionStore } from '../../src/store/useAuctionStore';
import { exportElementToImage } from '../../src/utils/posterExporter';
import { useToast } from '../../src/components/Toast';
import { CanvasElementRenderer } from '../../src/components/poster-editor/CanvasElementRenderer';
import { TransformHandles } from '../../src/components/poster-editor/TransformHandles';
import { EditorPropertyPanel } from '../../src/components/poster-editor/EditorPropertyPanel';
import {
  type CanvasElement,
  type TextElement,
  type ImageElement,
  type PosterEditorDocument,
  createDefaultPosterDocument,
} from '../../src/types/editor';
import {
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Loader2,
  Sparkles,
  Layers,
  Trash2,
} from 'lucide-react';

export default function PosterStudio() {
  const store = useAuctionStore();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const initialTeamId = searchParams.get('teamId') || store.teams[0]?.id || '';
  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeamId);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.55);
  const [isExporting, setIsExporting] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'editor' | 'layers'>('editor');

  // Containers
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const canvasNodeRef = useRef<HTMLDivElement>(null);
  const exportNodeRef = useRef<HTMLDivElement>(null);

  // Active Team & Sold Players
  const currentTeam = useMemo(
    () => store.teams.find((t) => t.id === selectedTeamId) || store.teams[0] || null,
    [store.teams, selectedTeamId]
  );

  const soldPlayers = useMemo(() => {
    if (!currentTeam) return [];
    return currentTeam.players
      .map((id) => store.players.find((p) => p.id === id))
      .filter((p): p is typeof store.players[0] => p !== undefined);
  }, [currentTeam, store.players]);

  // Document state
  const [doc, setDoc] = useState<PosterEditorDocument>(() => {
    return createDefaultPosterDocument(
      currentTeam,
      store.players,
      store.settings.tournamentName,
      store.settings.tournamentLogo
    );
  });

  // Automatically calculate optimal Zoom to fit the preview viewport (9:16 ratio)
  const autoFitZoom = useCallback(() => {
    if (!previewContainerRef.current) return;
    const { clientWidth, clientHeight } = previewContainerRef.current;
    if (clientWidth && clientHeight) {
      const padding = 40;
      const fitX = (clientWidth - padding) / 1080;
      const fitY = (clientHeight - padding) / 1920;
      const optimal = Math.max(0.2, Math.min(fitX, fitY, 0.95));
      setZoomLevel(Number(optimal.toFixed(3)));
    }
  }, []);

  // Run autoFitZoom when window/container resizes
  useEffect(() => {
    autoFitZoom();
    const handleResize = () => autoFitZoom();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoFitZoom]);

  // When selected franchise changes, update team name and player grid elements
  useEffect(() => {
    if (currentTeam) {
      setDoc((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => {
          if (el.id === 'team-name-banner' && el.type === 'text') {
            return { ...el, text: currentTeam.name.toUpperCase() };
          }
          if (el.id === 'player-squad-grid' && el.type === 'player-grid') {
            return { ...el, columns: soldPlayers.length > 12 ? 5 : el.columns };
          }
          if (el.id === 'logo-right' && el.type === 'image' && currentTeam.logo) {
            return { ...el, src: currentTeam.logo };
          }
          return el;
        }),
      }));
    }
  }, [currentTeam, soldPlayers.length]);

  // Selected element helper
  const selectedElement = useMemo(
    () => doc.elements.find((el) => el.id === selectedElementId) || null,
    [doc.elements, selectedElementId]
  );

  // ── ELEMENT MANIPULATION HANDLERS ──────────────────────────────────────────

  const handleUpdateElement = (updatedProps: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === selectedElementId ? ({ ...el, ...updatedProps } as CanvasElement) : el
      ),
    }));
  };

  const handleUpdateBackground = (updatedBg: Partial<typeof doc.background>) => {
    setDoc((prev) => ({
      ...prev,
      background: { ...prev.background, ...updatedBg },
    }));
  };

  const handleDeleteElement = (id: string) => {
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleDuplicateElement = (id: string) => {
    const el = doc.elements.find((e) => e.id === id);
    if (!el) return;
    const newId = `${el.type}-${Date.now()}`;
    const duplicate = {
      ...el,
      id: newId,
      x: Math.min(el.x + 20, 900),
      y: Math.min(el.y + 20, 1400),
      zIndex: Math.max(...doc.elements.map((e) => e.zIndex), 0) + 1,
    };
    setDoc((prev) => ({
      ...prev,
      elements: [...prev.elements, duplicate],
    }));
    setSelectedElementId(newId);
  };

  const handleBringForward = (id: string) => {
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, zIndex: el.zIndex + 2 } : el
      ),
    }));
  };

  const handleSendBackward = (id: string) => {
    setDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, zIndex: Math.max(1, el.zIndex - 2) } : el
      ),
    }));
  };

  // Add custom text
  const handleAddText = (preset: 'heading' | 'subheading' | 'ribbon' | 'watermark' = 'heading') => {
    const newId = `text-${Date.now()}`;
    const maxZ = Math.max(...doc.elements.map((e) => e.zIndex), 0) + 1;

    let newEl: CanvasElement;
    if (preset === 'ribbon') {
      newEl = {
        id: `badge-${Date.now()}`,
        type: 'badge',
        badgeType: 'dates',
        x: 350,
        y: 400,
        width: 300,
        height: 40,
        zIndex: maxZ,
        text: 'NEW RIBBON BADGE',
        fontSize: 14,
        bgColor: '#991B1B',
        textColor: '#FFFFFF',
        borderColor: '#F59E0B',
      };
    } else {
      newEl = {
        id: newId,
        type: 'text',
        x: 200,
        y: 400,
        width: 600,
        height: 60,
        zIndex: maxZ,
        text: preset === 'heading' ? 'YOUR CUSTOM TEXT' : 'SUBTITLE / NOTE',
        fontSize: preset === 'heading' ? 44 : 20,
        fontFamily: preset === 'heading' ? 'Impact, sans-serif' : 'Arial Black, sans-serif',
        fontWeight: '900',
        color: '#FACC15',
        styleEffect: preset === 'heading' ? 'gold-3d' : 'flat',
        textAlign: 'center',
        letterSpacing: 2,
        textTransform: 'uppercase',
      };
    }

    setDoc((prev) => ({ ...prev, elements: [...prev.elements, newEl] }));
    setSelectedElementId(newEl.id);
    toast('success', 'Element Added', 'Drag or edit on canvas.');
  };

  // Add custom image / logo
  const handleAddImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const newId = `image-${Date.now()}`;
      const maxZ = Math.max(...doc.elements.map((e) => e.zIndex), 0) + 1;
      const newImg: ImageElement = {
        id: newId,
        type: 'image',
        x: 400,
        y: 200,
        width: 140,
        height: 140,
        zIndex: maxZ,
        src: reader.result as string,
        objectFit: 'contain',
        borderRadius: 0,
        opacity: 1,
      };
      setDoc((prev) => ({ ...prev, elements: [...prev.elements, newImg] }));
      setSelectedElementId(newId);
      toast('success', 'Image Added', 'Image placed on canvas.');
    };
    reader.readAsDataURL(file);
  };

  // Custom background upload
  const handleCustomBackgroundUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      handleUpdateBackground({
        preset: 'custom',
        customUrl: reader.result as string,
      });
      toast('success', 'Background Updated', 'Custom background active.');
    };
    reader.readAsDataURL(file);
  };

  // Reset to default template
  const handleReset = () => {
    setDoc(
      createDefaultPosterDocument(
        currentTeam,
        store.players,
        store.settings.tournamentName,
        store.settings.tournamentLogo
      )
    );
    setSelectedElementId(null);
    toast('info', 'Template Reset', 'Restored to original layout.');
  };

  // ── DRAG AND RESIZE INTERACTION ────────────────────────────────────────────

  const dragRef = useRef<{
    isDragging: boolean;
    isResizing: boolean;
    handle: string | null;
    startX: number;
    startY: number;
    initialElX: number;
    initialElY: number;
    initialElW: number;
    initialElH: number;
    initialFontSize?: number;
  }>({
    isDragging: false,
    isResizing: false,
    handle: null,
    startX: 0,
    startY: 0,
    initialElX: 0,
    initialElY: 0,
    initialElW: 0,
    initialElH: 0,
  });

  const handlePointerDownElement = (e: React.PointerEvent, element: CanvasElement) => {
    e.stopPropagation();
    setSelectedElementId(element.id);

    dragRef.current = {
      isDragging: true,
      isResizing: false,
      handle: null,
      startX: e.clientX,
      startY: e.clientY,
      initialElX: element.x,
      initialElY: element.y,
      initialElW: element.width,
      initialElH: element.height,
    };
  };

  const handleResizeStart = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    if (!selectedElement) return;

    dragRef.current = {
      isDragging: false,
      isResizing: true,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialElX: selectedElement.x,
      initialElY: selectedElement.y,
      initialElW: selectedElement.width,
      initialElH: selectedElement.height,
      initialFontSize: selectedElement.type === 'text' ? selectedElement.fontSize : undefined,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const { isDragging, isResizing, handle, startX, startY, initialElX, initialElY, initialElW, initialElH, initialFontSize } =
      dragRef.current;

    if (!isDragging && !isResizing) return;
    if (!selectedElementId) return;

    // Movement in canvas unscaled pixels
    const deltaX = (e.clientX - startX) / zoomLevel;
    const deltaY = (e.clientY - startY) / zoomLevel;

    if (isDragging) {
      const newX = Math.round(initialElX + deltaX);
      const newY = Math.round(initialElY + deltaY);
      handleUpdateElement({ x: newX, y: newY });
    } else if (isResizing && handle) {
      let newW = initialElW;
      let newH = initialElH;
      let newX = initialElX;
      let newY = initialElY;

      if (handle.includes('e')) newW = Math.max(30, initialElW + deltaX);
      if (handle.includes('s')) newH = Math.max(20, initialElH + deltaY);
      if (handle.includes('w')) {
        const potentialW = initialElW - deltaX;
        if (potentialW > 30) {
          newW = potentialW;
          newX = initialElX + deltaX;
        }
      }
      if (handle.includes('n')) {
        const potentialH = initialElH - deltaY;
        if (potentialH > 20) {
          newH = potentialH;
          newY = initialElY + deltaY;
        }
      }

      const updates: Partial<CanvasElement> = {
        width: Math.round(newW),
        height: Math.round(newH),
        x: Math.round(newX),
        y: Math.round(newY),
      };

      // Proportionally scale text if corner resize
      if (initialFontSize && (handle === 'se' || handle === 'nw' || handle === 'ne' || handle === 'sw')) {
        const scaleRatio = newW / initialElW;
        const newFontSize = Math.max(8, Math.round(initialFontSize * scaleRatio));
        (updates as Partial<TextElement>).fontSize = newFontSize;
      }

      handleUpdateElement(updates);
    }
  };

  const handlePointerUp = () => {
    dragRef.current.isDragging = false;
    dragRef.current.isResizing = false;
  };

  // Keyboard nudge & delete support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const step = e.shiftKey ? 10 : 2;
      const el = doc.elements.find((elem) => elem.id === selectedElementId);
      if (!el) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleUpdateElement({ x: el.x - step });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleUpdateElement({ x: el.x + step });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleUpdateElement({ y: el.y - step });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleUpdateElement({ y: el.y + step });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteElement(selectedElementId);
      } else if (e.key === 'Escape') {
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, doc.elements]);

  // ── EXPORT CANVAS TO IMAGE ─────────────────────────────────────────────────

  const handleExport = async (format: 'png' | 'jpeg') => {
    const targetNode = exportNodeRef.current || canvasNodeRef.current;
    if (!targetNode) return;
    try {
      setIsExporting(true);
      // Temporarily deselect to avoid exporting selection handles
      setSelectedElementId(null);

      // Wait a tick for React to clear handles from DOM
      await new Promise((r) => setTimeout(r, 60));

      const safeTeamName = (currentTeam?.name || 'Squad').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeTeamName}_Official_Poster.${format}`;

      await exportElementToImage(targetNode, {
        fileName: filename,
        format,
        scale: 2, // 2160 x 3840 Ultra HD (exact 9:16)
        quality: 0.95,
        width: 1080,
        height: 1920,
      });

      toast('success', 'Poster Downloaded', `Saved as ${filename}`);
    } catch (err) {
      console.error('Export error:', err);
      const msg = err instanceof Error ? err.message : 'An error occurred while generating the image.';
      toast('error', 'Export Failed', msg);
    } finally {
      setIsExporting(false);
    }
  };

  // Background CSS generator
  const getCanvasBackgroundStyle = (): React.CSSProperties => {
    if (doc.background.preset === 'custom' && doc.background.customUrl) {
      return {
        backgroundImage: `url(${doc.background.customUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }

    switch (doc.background.preset) {
      case 'stadium-gold':
        return {
          background: `
            radial-gradient(ellipse 80% 40% at 50% 0%, rgba(245, 158, 11, 0.4) 0%, transparent 70%),
            radial-gradient(circle at 20% 15%, rgba(251, 191, 36, 0.25) 0%, transparent 45%),
            radial-gradient(circle at 80% 15%, rgba(251, 191, 36, 0.25) 0%, transparent 45%),
            radial-gradient(circle at 50% 90%, rgba(245, 158, 11, 0.25) 0%, transparent 60%),
            linear-gradient(180deg, #070e1e 0%, #0c1836 40%, #050b18 100%)
          `,
        };
      case 'electric-blue':
        return {
          background: `
            radial-gradient(ellipse 90% 45% at 50% 0%, rgba(56, 189, 248, 0.4) 0%, transparent 75%),
            radial-gradient(circle at 15% 20%, rgba(14, 165, 233, 0.3) 0%, transparent 45%),
            radial-gradient(circle at 85% 20%, rgba(14, 165, 233, 0.3) 0%, transparent 45%),
            linear-gradient(180deg, #020b1c 0%, #0a1f44 50%, #020712 100%)
          `,
        };
      case 'dark-arena':
        return {
          background: `
            radial-gradient(ellipse 70% 35% at 50% 0%, rgba(255, 255, 255, 0.15) 0%, transparent 70%),
            radial-gradient(circle at 50% 85%, rgba(217, 119, 6, 0.15) 0%, transparent 60%),
            linear-gradient(180deg, #11141a 0%, #090a0d 100%)
          `,
        };
      case 'carbon-luxury':
        return {
          background: `
            radial-gradient(circle at 50% 10%, rgba(245, 158, 11, 0.25) 0%, transparent 60%),
            linear-gradient(135deg, #171717 0%, #0a0a0a 50%, #000000 100%)
          `,
        };
      case 'stadium-night':
      default:
        return {
          background: `
            radial-gradient(ellipse 80% 35% at 50% 0%, rgba(125, 211, 252, 0.35) 0%, transparent 65%),
            radial-gradient(circle at 10% 15%, rgba(255, 255, 255, 0.4) 0%, transparent 25%),
            radial-gradient(circle at 90% 15%, rgba(255, 255, 255, 0.4) 0%, transparent 25%),
            radial-gradient(circle at 50% 85%, rgba(245, 158, 11, 0.25) 0%, transparent 55%),
            linear-gradient(180deg, #061126 0%, #0b1e42 35%, #081630 70%, #030814 100%)
          `,
        };
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* ── TOP ACTION BAR ────────────────────────────────────────────── */}
      <div className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles size={18} />
            </span>
            <h1 className="font-black text-lg text-white tracking-wide">POSTER STUDIO</h1>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Franchise Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Franchise:</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-amber-500 font-bold"
            >
              {store.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.players.length} players)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Viewport Zoom & Export Buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.2, Number((z - 0.05).toFixed(2))))}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
              title="Zoom out"
            >
              <ZoomOut size={15} />
            </button>
            <span className="text-xs font-mono font-bold px-1.5 text-slate-300 w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.2, Number((z + 0.05).toFixed(2))))}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
              title="Zoom in"
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={autoFitZoom}
              className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-amber-400 hover:bg-slate-700 rounded transition"
              title="Fit to screen"
            >
              <Maximize2 size={13} /> Fit
            </button>
          </div>

          {/* Reset Template */}
          <button
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Reset to default template"
          >
            <RefreshCw size={15} />
          </button>

          {/* Download PNG */}
          <button
            onClick={() => handleExport('png')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-sm font-black rounded-lg transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download PNG
          </button>
        </div>
      </div>

      {/* ── WORKSPACE (LEFT PROPERTY PANEL + RIGHT CANVA-LIKE PREVIEW) ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT CONTROL SIDEBAR */}
        <div className="w-80 md:w-96 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0 z-10">
          {/* Sub tabs: Editor Inspector / Layers List */}
          <div className="flex border-b border-slate-800 bg-slate-900/90 text-xs font-bold text-slate-400">
            <button
              onClick={() => setActiveSidebarTab('editor')}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                activeSidebarTab === 'editor'
                  ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                  : 'border-transparent hover:text-slate-200'
              }`}
            >
              {selectedElement ? 'Element Inspector' : 'Tools & Background'}
            </button>
            <button
              onClick={() => setActiveSidebarTab('layers')}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeSidebarTab === 'layers'
                  ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                  : 'border-transparent hover:text-slate-200'
              }`}
            >
              <Layers size={14} /> Layers ({doc.elements.length})
            </button>
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 overflow-y-auto">
            {activeSidebarTab === 'editor' ? (
              <EditorPropertyPanel
                selectedElement={selectedElement}
                background={doc.background}
                onUpdateElement={handleUpdateElement}
                onUpdateBackground={handleUpdateBackground}
                onAddText={handleAddText}
                onAddImage={handleAddImage}
                onCustomBackgroundUpload={handleCustomBackgroundUpload}
              />
            ) : (
              /* Layers View */
              <div className="p-3 space-y-1">
                <p className="text-xs text-slate-400 px-2 py-1 font-semibold">Click a layer to select & edit:</p>
                {doc.elements
                  .slice()
                  .reverse()
                  .map((el) => (
                    <div
                      key={el.id}
                      onClick={() => {
                        setSelectedElementId(el.id);
                        setActiveSidebarTab('editor');
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition ${
                        selectedElementId === el.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {el.type}
                        </span>
                        <span className="truncate">
                          {el.type === 'text'
                            ? el.text.slice(0, 22)
                            : el.type === 'badge'
                            ? el.text
                            : el.type === 'image'
                            ? 'Image / Logo'
                            : 'Player Squad Grid'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-70">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteElement(el.id);
                          }}
                          className="hover:text-red-400 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PREVIEW & INTERACTIVE CANVAS */}
        <div
          ref={previewContainerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => setSelectedElementId(null)}
          className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-8 relative"
          style={{ minHeight: '100%' }}
        >
          {/* Scaled Wrapper: Keeps layout bounds tightly matched to zoom (9:16 aspect ratio) */}
          <div
            style={{
              width: `${1080 * zoomLevel}px`,
              height: `${1920 * zoomLevel}px`,
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {/* The 1080 x 1920 (9:16) Canvas */}
            <div
              ref={canvasNodeRef}
              id="poster-studio-capture-canvas"
              className="relative text-white font-sans overflow-hidden shadow-2xl rounded-xl border border-white/10"
              style={{
                width: '1080px',
                height: '1920px',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
                ...getCanvasBackgroundStyle(),
              }}
            >
              {/* Stadium Floodlights & Darkness Layer */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  className="absolute -top-16 -left-16 w-80 h-80 rounded-full blur-3xl opacity-40"
                  style={{ background: 'radial-gradient(circle, #ffffff 0%, #38bdf8 60%, transparent 80%)' }}
                />
                <div
                  className="absolute -top-16 -right-16 w-80 h-80 rounded-full blur-3xl opacity-40"
                  style={{ background: 'radial-gradient(circle, #ffffff 0%, #38bdf8 60%, transparent 80%)' }}
                />
                <div
                  className="absolute top-12 left-0 right-0 h-44 opacity-25"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />
                <div
                  className="absolute top-72 left-0 right-0 h-1 blur-sm"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, #f59e0b 50%, transparent 100%)' }}
                />
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: `rgba(0, 0, 0, ${doc.background.darkness / 100})` }}
                />
              </div>

              {/* Canvas Interactive Elements */}
              {doc.elements.map((el) => {
                const isSelected = el.id === selectedElementId;
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handlePointerDownElement(e, el)}
                    className="absolute cursor-move select-none"
                    style={{
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width}px`,
                      height: `${el.height}px`,
                      zIndex: el.zIndex,
                    }}
                  >
                    {/* Element Graphic Body */}
                    <CanvasElementRenderer element={el} players={soldPlayers} isSelected={isSelected} />

                    {/* Transform Handles when selected */}
                    {isSelected && (
                      <TransformHandles
                        element={el}
                        onResizeStart={handleResizeStart}
                        onDelete={handleDeleteElement}
                        onDuplicate={handleDuplicateElement}
                        onBringForward={handleBringForward}
                        onSendBackward={handleSendBackward}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── UNTRANSFORMED 1080 x 1920 (9:16) EXPORT CANVAS ───────────────── */}
      {/* Kept offscreen and isolated from zoomLevel, sidebar layout, and interactive selection handles */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '1080px',
          height: '1920px',
          overflow: 'hidden',
          zIndex: -9999,
          pointerEvents: 'none',
        }}
      >
        <div
          ref={exportNodeRef}
          id="poster-studio-offscreen-export-canvas"
          className="relative text-white font-sans overflow-hidden select-none"
          style={{
            width: '1080px',
            height: '1920px',
            boxSizing: 'border-box',
            position: 'relative',
            ...getCanvasBackgroundStyle(),
          }}
        >
          {/* Stadium Floodlights & Darkness Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -top-16 -left-16 w-80 h-80 rounded-full blur-3xl opacity-40"
              style={{ background: 'radial-gradient(circle, #ffffff 0%, #38bdf8 60%, transparent 80%)' }}
            />
            <div
              className="absolute -top-16 -right-16 w-80 h-80 rounded-full blur-3xl opacity-40"
              style={{ background: 'radial-gradient(circle, #ffffff 0%, #38bdf8 60%, transparent 80%)' }}
            />
            <div
              className="absolute top-12 left-0 right-0 h-44 opacity-25"
              style={{
                backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
            <div
              className="absolute top-72 left-0 right-0 h-1 blur-sm"
              style={{ background: 'linear-gradient(90deg, transparent 0%, #f59e0b 50%, transparent 100%)' }}
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `rgba(0, 0, 0, ${doc.background.darkness / 100})` }}
            />
          </div>

          {/* All Canvas Elements Rendered Cleanly at Exact Unscaled 1080x1920 Coordinates */}
          {doc.elements.map((el) => (
            <div
              key={el.id}
              className="absolute select-none pointer-events-none"
              style={{
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                height: `${el.height}px`,
                zIndex: el.zIndex,
              }}
            >
              <CanvasElementRenderer element={el} players={soldPlayers} isSelected={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
