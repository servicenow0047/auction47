import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 4000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showBackOnline) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-bottom-10 fade-in duration-300">
      {!isOnline ? (
        <div className="bg-red-600 border border-red-500 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 font-medium">
          <WifiOff size={20} className="animate-pulse" />
          You are currently offline. Check your connection.
        </div>
      ) : showBackOnline ? (
        <div className="bg-emerald-600 border border-emerald-500 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 font-medium">
          <Wifi size={20} />
          Back online! Connection restored.
        </div>
      ) : null}
    </div>
  );
}
