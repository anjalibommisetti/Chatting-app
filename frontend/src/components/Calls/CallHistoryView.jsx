// ==============================================================================
// VibeConnect — Professional Call History & Missed Calls View (Screen 12)
// ==============================================================================

import React, { useState } from 'react';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Video, 
  Clock, 
  Search, 
  PhoneCall 
} from 'lucide-react';
import { store } from '../../services/store';

export default function CallHistoryView({ onStartCall }) {
  const [filter, setFilter] = useState('all'); // 'all', 'missed'
  const callLogs = store.callLogs;

  const filteredLogs = callLogs.filter(log => {
    if (filter === 'missed') return log.status === 'missed';
    return true;
  });

  const formatDuration = (secs) => {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[var(--bg-main)] overflow-y-auto p-4 sm:p-8 select-none text-[var(--text-primary)]">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-[var(--text-primary)]">Call History</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Review your recent voice and video calls</p>
          </div>

          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-[var(--border-color)] text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-purple-600 text-white shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Calls
            </button>
            <button
              onClick={() => setFilter('missed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filter === 'missed' ? 'bg-purple-600 text-white shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Missed
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-muted)] text-xs rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <Phone className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
              <p>No call records found.</p>
              <p className="text-[11px] opacity-70 mt-1">
                Completed and missed voice or video calls will automatically appear here.
              </p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const peer = log.peerId ? store.getUserById(log.peerId) : null;
              const group = log.groupId ? store.groups.find(g => g.id === log.groupId) : null;
              const title = log.groupId ? (group?.name || 'Group Call') : store.getDisplayName(peer);
              const avatar = log.groupId ? (group?.avatar || '👥') : (peer?.avatar || '👤');

              const isMissed = log.status === 'missed';
              const isVideo = log.callType === 'video';

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between shadow-xs hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shadow-inner">
                      {avatar}
                    </div>

                    <div className="flex flex-col text-left">
                      <span className={`font-heading font-bold text-sm ${isMissed ? 'text-rose-400' : 'text-[var(--text-primary)]'}`}>
                        {title}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                        <span className="flex items-center gap-1">
                          {isMissed ? (
                            <PhoneMissed className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span className="capitalize">{log.status}</span>
                        </span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <span>•</span>
                        <span>{formatDuration(log.duration)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Redial Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onStartCall({
                        type: isVideo ? 'video' : 'voice',
                        isGroup: !!log.groupId,
                        targetId: log.groupId || log.peerId,
                        targetName: title,
                        targetAvatar: avatar,
                        participants: log.groupId ? (group?.members || []) : [log.peerId]
                      })}
                      className="p-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-400 hover:text-white transition-colors cursor-pointer"
                      title="Redial Call"
                    >
                      {isVideo ? <Video className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
