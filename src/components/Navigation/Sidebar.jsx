// ==============================================================================
// VibeConnect — Professional Desktop Navigation Sidebar
// Responsive sidebar with tabs, badges, quick theme toggle, and user profile
// ==============================================================================

import React from 'react';
import { 
  MessageSquare, 
  Phone, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Lock, 
  Sun,
  Moon,
  QrCode
} from 'lucide-react';
import { store } from '../../services/store';

export default function Sidebar({ currentTab, setTab, onOpenCreateGroup, onOpenProfile, onOpenQR }) {
  const currentUser = store.currentUser;
  const isDark = store.settings.theme === 'dark';

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    store.updateSettings({ theme: nextTheme });
  };

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare, badge: 0 },
    { id: 'calls', label: 'Calls', icon: Phone, badge: 0 },
    { id: 'settings', label: 'Settings', icon: Settings, badge: 0 }
  ];

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex-shrink-0 select-none transition-all duration-300 text-[var(--text-primary)]">
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-4 lg:px-6 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 font-bold text-xl flex-shrink-0">
            💬
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-heading font-extrabold text-lg text-[var(--text-primary)] tracking-tight flex items-center gap-1.5">
              VibeChat
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500 animate-pulse"></span>
            </span>
            <span className="text-[11px] text-purple-400 font-medium">Simple Chat & Calls</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* QR Hub Button */}
          <button
            onClick={onOpenQR}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer"
            title="Scan QR or Show Profile QR"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Quick Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="hidden lg:flex p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-500" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-purple-600/15 text-purple-400 border border-purple-500/30 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-purple-400' : 'text-[var(--text-secondary)]'}`} />
              <span className="hidden lg:inline font-medium">{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-auto hidden lg:inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-600 text-white">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-purple-500 rounded-r-full lg:hidden"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Privacy Badge */}
      <div className="hidden lg:block mx-4 my-2 p-3 rounded-xl bg-white/[0.02] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5 text-purple-400 font-semibold mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Private Key Protected</span>
        </div>
        <p className="opacity-80 leading-relaxed text-[10px]">
          Dedicated 2-member space with real-time online presence and vanishing view-once media.
        </p>
      </div>

      {/* User Profile Bar & Quick Logout */}
      <div className="p-3 border-t border-[var(--border-color)]">
        <div 
          onClick={onOpenProfile}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
        >
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl shadow-inner">
              {currentUser?.avatar || '🦊'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-surface)]"></span>
          </div>
          
          <div className="hidden lg:flex flex-col min-w-0 flex-1 text-left">
            <span className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-purple-400 transition-colors">
              {currentUser?.nickname || currentUser?.name || currentUser?.username}
            </span>
            <span className="text-xs text-[var(--text-muted)] truncate">
              @{currentUser?.username}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              store.logOut();
            }}
            className="flex p-2 text-[var(--text-muted)] hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
