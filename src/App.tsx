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

// Public root handler: if no admin password, render PlayerRegistration directly
const RootHandler = () => {
  const password = localStorage.getItem('admin_password');
  if (!password) {
    return <PlayerRegistration />;
  }
  return <Layout />;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const password = localStorage.getItem('admin_password');
  if (!password) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const loadState = useAuctionStore(s => s.loadState);

  useEffect(() => {
    // Only load heavy auction state if an authenticated admin is logged in
    const password = localStorage.getItem('admin_password');
    if (password) {
      loadState();
    }
  }, [loadState]);

  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          {/* Root Route: Shows PlayerRegistration for public users, Layout for logged-in admin */}
          <Route path="/" element={<RootHandler />}>
            <Route index element={<Home />} />
            <Route path="teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
            <Route path="players" element={<ProtectedRoute><Players /></ProtectedRoute>} />
            <Route path="auction" element={<ProtectedRoute><LiveAuction /></ProtectedRoute>} />
            <Route path="unsold" element={<ProtectedRoute><UnsoldPlayers /></ProtectedRoute>} />
            <Route path="log" element={<ProtectedRoute><AuctionLog /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="form-builder" element={<ProtectedRoute><FormBuilder /></ProtectedRoute>} />
            <Route path="preshow" element={<ProtectedRoute><PreShowDisplay /></ProtectedRoute>} />
            <Route path="posters" element={<ProtectedRoute><PosterStudio /></ProtectedRoute>} />
          </Route>
          
          {/* Explicit Public Routes */}
          <Route path="/register" element={<PlayerRegistration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/display" element={<LiveDisplay />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}

export default App;
