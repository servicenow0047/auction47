import { useState, useRef, useEffect } from 'react';
import { Upload, Play, Tv2, RefreshCw } from 'lucide-react';
import { useAuctionStore } from '../store/useAuctionStore';

export default function PreShowDisplay() {
  const settings = useAuctionStore(s => s.settings);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved video from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('preshow_video');
    if (saved) setVideoSrc(saved);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    // Also read as base64 for persistence (warn for large files)
    if (file.size < 100 * 1024 * 1024) { // < 100MB
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          localStorage.setItem('preshow_video', reader.result as string);
        } catch {
          console.warn('Video too large to persist in localStorage');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
    setTimeout(() => {
      videoRef.current?.play();
    }, 100);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    videoRef.current?.pause();
  };

  const clearVideo = () => {
    setVideoSrc(null);
    localStorage.removeItem('preshow_video');
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pre-Show Display</h1>
        <p className="text-slate-500 mt-1">Upload a video to play on screen before the auction starts. It will loop continuously.</p>
      </div>

      {/* Upload Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Tv2 className="text-purple-500" size={20} />
            Auction Starting Soon Video
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload an MP4, WebM, or MOV video. It will play on loop in fullscreen.
          </p>
        </div>

        <div className="p-8">
          {!videoSrc ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-4 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all group">
              <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-purple-500 transition-colors">
                <div className="w-16 h-16 rounded-full bg-slate-100 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                  <Upload size={30} />
                </div>
                <p className="font-bold text-lg">Click to upload video</p>
                <p className="text-sm">MP4, WebM, MOV supported</p>
              </div>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-xl">
                <video
                  src={videoSrc}
                  className="w-full h-full object-contain"
                  controls
                  loop
                />
                <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1">
                  <RefreshCw size={10} /> Looping
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={openFullscreen}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black px-8 py-3 rounded-2xl shadow-lg transition-all hover:scale-105"
                >
                  <Play size={18} fill="currentColor" />
                  Launch Fullscreen
                </button>
                <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-2xl cursor-pointer transition-all">
                  <Upload size={16} />
                  Change Video
                  <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  onClick={clearVideo}
                  className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-6 py-3 rounded-2xl transition-all border border-red-100"
                >
                  Remove Video
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 font-medium">
                💡 <strong>Tip:</strong> Click <strong>"Launch Fullscreen"</strong> to show this on a projector or secondary screen. The video will loop automatically no matter how short it is.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center cursor-none"
          ref={containerRef}
          onDoubleClick={closeFullscreen}
        >
          {/* Branding overlay - top */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-10 py-6 bg-gradient-to-b from-black/70 to-transparent z-10 pointer-events-none">
            <div className="flex items-center gap-4">
              {settings.tournamentLogo && (
                <img src={settings.tournamentLogo} alt="Logo" className="h-12 object-contain" />
              )}
              {settings.tournamentName && (
                <span className="text-white font-black text-2xl tracking-widest uppercase drop-shadow-lg">
                  {settings.tournamentName}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Powered By</span>
              <span className="text-white font-black text-xl tracking-widest">AUCTION 47</span>
            </div>
          </div>

          {/* The looping video */}
          <video
            ref={videoRef}
            src={videoSrc!}
            className="w-full h-full object-contain"
            autoPlay
            loop
            playsInline
          />

          {/* "Auction Starting Soon" overlay - bottom */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-10 py-8 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none">
            <div className="flex flex-col gap-1">
              <span className="text-yellow-400 font-black text-4xl md:text-6xl tracking-widest uppercase drop-shadow-[0_2px_20px_rgba(250,204,21,0.5)] animate-pulse">
                Auction Starting Soon
              </span>
              <span className="text-white/60 text-sm font-bold tracking-widest uppercase">
                Double-click anywhere to exit fullscreen
              </span>
            </div>
            <span className="text-white/40 font-mono text-xs">auction047@gmail.com</span>
          </div>
        </div>
      )}
    </div>
  );
}
