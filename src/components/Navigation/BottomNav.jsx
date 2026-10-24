// ==============================================================================
// VibeConnect — Mobile Responsive Bottom Navigation Bar
// ==============================================================================

import React from 'react';
import { MessageSquare, Phone, Settings, Lock } from 'lucide-react';
import { store } from '../../services/store';

export default function BottomNav({ currentTab, setTab }) {
  const tabs = [
    { id: 'chats', label: 'Duo Chat', icon: MessageSquare },
    { id: 'lock', label: 'Lock', icon: Lock, isAction: true },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-surface)] backdrop-blur-xl border-t border-[var(--border-color)] flex items-center justify-around px-2 z-40 select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        if (tab.isAction) {
          return (
            <button
              key={tab.id}
              onClick={() => store.lockVault()}
              className="w-12 h-12 rounded-2xl bg-vibe-gradient text-white flex items-center justify-center shadow-lg shadow-purple-600/40 active:scale-95 transition-transform -mt-5 border-2 border-[var(--bg-surface)] cursor-pointer"
              title="Lock Private Vault"
            >
              <Lock className="w-5 h-5" />
            </button>
          );
        }

        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-colors cursor-pointer ${
              isActive ? 'text-purple-400 font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
