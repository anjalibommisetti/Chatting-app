// ==============================================================================
// VibeConnect — Desktop Navigation Sidebar
// ==============================================================================

import React from 'react';
import { 
  MessageSquare, 
  Users, 
  Phone, 
  UserCheck, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Plus, 
  Radio
} from 'lucide-react';
import { store } from '../../services/store';

export default function Sidebar({ currentTab, setTab, onOpenCreateGroup, onOpenProfile }) {
  const currentUser = store.currentUser;

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageSquare, badge: 1 },
    { id: 'groups', label: 'Groups', icon: Users, badge: 0 },
    { id: 'calls', label: 'Calls', icon: Phone, badge: 0 },
    { id: 'contacts', label: 'Contacts', icon: UserCheck, badge: 0 },
    { id: 'settings', label: 'Settings', icon: Settings, badge: 0 }
  ];

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-[#0B0E17] border-r border-white/5 flex-shrink-0 select-none transition-all duration-300">
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-4 lg:px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 font-bold text-xl flex-shrink-0">
            V
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-heading font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
              VibeConnect
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500"></span>
            </span>
            <span className="text-[11px] text-purple-300/60 font-medium">Private 1-to-5 Messenger</span>
          </div>
        </div>
      </div>

      {/* Quick Action Button: Create Group */}
      <div className="p-3 lg:p-4">
        <button
          onClick={onOpenCreateGroup}
          className="w-full py-2.5 px-3 lg:px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/25 active:scale-95 group cursor-pointer"
          title="Create New Private Group (Max 5)"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span className="hidden lg:inline text-xs font-semibold">New Group (Max 5)</span>
        </button>
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
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-inner'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
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

      {/* Security Privacy Badge */}
      <div className="hidden lg:block mx-4 my-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-purple-400 font-semibold mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Strict Privacy</span>
        </div>
        <p className="text-slate-400/80 leading-relaxed">
          Groups strictly capped at 5 members. End-to-end direct communication.
        </p>
      </div>

      {/* User Profile Bar & Quick Menu */}
      <div className="p-3 border-t border-white/5">
        <div 
          onClick={onOpenProfile}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
        >
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl shadow-inner">
              {currentUser?.avatar || '🦊'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B0E17]"></span>
          </div>
          
          <div className="hidden lg:flex flex-col min-w-0 flex-1 text-left">
            <span className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
              {currentUser?.nickname || currentUser?.username}
            </span>
            <span className="text-xs text-slate-400 truncate">
              @{currentUser?.username}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              store.logOut();
            }}
            className="hidden lg:flex p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
