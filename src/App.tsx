import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Settings from './pages/Settings';
import FormBuilder from './pages/FormBuilder';
import Teams from './pages/Teams';
import Players from './pages/Players';
import LiveAuction from './pages/LiveAuction';
import LiveDisplay from './pages/LiveDisplay';
import UnsoldPlayers from './pages/UnsoldPlayers';
import AuctionLog from './pages/AuctionLog';
import PlayerRegistration from './pages/PlayerRegistration';
import Login from './pages/Login';
import PreShowDisplay from './pages/PreShowDisplay';
import PosterStudio from './pages/PosterStudio';
import { ToastProvider } from './components/Toast';

import { useEffect } from 'react';
import { useAuctionStore } from './store/useAuctionStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const password = localStorage.getItem('admin_password');
  if (!password) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const loadState = useAuctionStore(s => s.loadState);

  useEffect(() => {
    // Only load heavy auction state if running locally and admin is logged in
    if (isLocal) {
      const password = localStorage.getItem('admin_password');
      if (password) {
        loadState();
      }
    }
  }, [isLocal, loadState]);

  // ON VERCEL (ONLINE): Strictly render Player Registration
  if (!isLocal) {
    return (
      <ToastProvider>
        <PlayerRegistration />
      </ToastProvider>
    );
  }

  // ON LOCAL PC: Full Auction System (Admin, Live Auction, Display, Teams)
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Admin Routes */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="teams" element={<Teams />} />
            <Route path="players" element={<Players />} />
            <Route path="auction" element={<LiveAuction />} />
            <Route path="unsold" element={<UnsoldPlayers />} />
            <Route path="log" element={<AuctionLog />} />
            <Route path="settings" element={<Settings />} />
            <Route path="form-builder" element={<FormBuilder />} />
            <Route path="preshow" element={<PreShowDisplay />} />
            <Route path="posters" element={<PosterStudio />} />
          </Route>
          
          {/* Public Routes */}
          <Route path="/register" element={<PlayerRegistration />} />
          <Route path="/display" element={<LiveDisplay />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}
