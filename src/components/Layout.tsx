import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Users, UsersRound, Settings, MonitorPlay, PlayCircle, XCircle, ScrollText, UserPlus, SlidersHorizontal, Menu } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuctionStore } from '../store/useAuctionStore';
import NetworkStatus from './NetworkStatus';

export default function Layout() {
  const location = useLocation();
  const status = useAuctionStore(s => s.status);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Teams', path: '/teams', icon: UsersRound },
    { name: 'Players', path: '/players', icon: Users },
    { name: 'Register Player', path: '/register', icon: UserPlus },
    { name: 'Live Auction', path: '/auction', icon: PlayCircle },
    { name: 'Unsold Players', path: '/unsold', icon: XCircle },
    { name: 'Activity Log', path: '/log', icon: ScrollText },
    { name: 'Form Builder', path: '/form-builder', icon: SlidersHorizontal },
    { name: 'Display Screen', path: '/display', icon: MonitorPlay },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-64" : "w-[72px]"
      )}>
        <div className="h-16 flex items-center justify-center border-b border-slate-800">
          <h1 className="text-xl font-black text-white tracking-tight flex items-center justify-center shrink-0">
            {isSidebarOpen ? 'AUCTION 47' : 'A47'}
          </h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 overflow-x-hidden">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                isSidebarOpen ? "px-3 py-2.5 gap-3" : "justify-center p-3",
                location.pathname === item.path
                  ? "bg-purple-600/10 text-purple-400"
                  : "hover:bg-slate-800 hover:text-white"
              )}
              title={!isSidebarOpen ? item.name : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              {isSidebarOpen && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {'badge' in item && (item.badge as number) > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {item.badge as number}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>
        
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className={cn(
            "bg-slate-800 rounded-lg",
            isSidebarOpen ? "p-3" : "py-3 flex justify-center"
          )} title={!isSidebarOpen ? `Status: ${status}` : undefined}>
            {isSidebarOpen && (
              <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Auction Status</p>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                status === 'setup' ? "bg-slate-500" :
                status === 'ready' ? "bg-blue-500" :
                status === 'running' ? "bg-green-500 animate-pulse" :
                "bg-purple-500"
              )} />
              {isSidebarOpen && (
                <span className="text-slate-200 capitalize font-medium">{status}</span>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => {
              localStorage.removeItem('admin_password');
              window.location.href = '/login';
            }}
            className={cn(
              "w-full flex items-center justify-center gap-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors rounded-lg font-bold",
              isSidebarOpen ? "py-2.5 text-sm" : "py-3 opacity-0 overflow-hidden hidden"
            )}
            title="Log Out"
          >
            {isSidebarOpen && <span>Log Out Admin</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 transition-all">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
            >
              <Menu size={22} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 capitalize">
              {navItems.find(i => i.path === location.pathname)?.name || 'AUCTION 47'}
            </h2>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <footer className="mt-12 text-center text-sm font-bold text-slate-400">
            &copy; {new Date().getFullYear()} AUCTION47
          </footer>
        </div>
      </main>

      <NetworkStatus />
    </div>
  );
}
