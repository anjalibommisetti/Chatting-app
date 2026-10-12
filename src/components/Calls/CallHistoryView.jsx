// ==============================================================================
// VibeConnect — Call History & Missed Calls View (Screen 12)
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
    <div className="flex-1 h-full flex flex-col bg-[#07090F] overflow-y-auto p-4 sm:p-8 select-none">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-white">Call History</h2>
            <p className="text-xs text-slate-400 mt-1">Review your recent voice and video calls</p>
          </div>

          <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Calls
            </button>
            <button
              onClick={() => setFilter('missed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filter === 'missed' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Missed
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs rounded-2xl bg-white/[0.01] border border-white/5">
              <Phone className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
              <p>No call records found.</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const peer = log.peerId ? store.getUserById(log.peerId) : null;
              const group = log.groupId ? store.groups.find(g => g.id === log.groupId) : null;

              const title = group ? group.name : (peer ? store.getDisplayName(peer) : 'Direct Call');
              const avatar = group ? group.avatar : (peer?.avatar || '👤');
              const isMissed = log.status === 'missed';
              const isVideo = log.callType === 'video';

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#101422] border border-white/5 hover:border-white/10 transition-all shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {avatar}
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-heading font-bold text-sm text-white flex items-center gap-2">
                        {title}
                        {group && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-500/15 text-purple-300 font-semibold">
                            Group
                          </span>
                        )}
                      </span>

                      <div className="flex items-center gap-2 text-xs mt-1">
                        {isMissed ? (
                          <span className="text-rose-400 flex items-center gap-1 font-medium">
                            <PhoneMissed className="w-3.5 h-3.5" />
                            <span>Missed {isVideo ? 'Video' : 'Voice'} Call</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1 font-medium">
                            <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isVideo ? 'Video' : 'Voice'} Call ({formatDuration(log.duration)})</span>
                          </span>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Call Back Button */}
                  <button
                    onClick={() => {
                      if (group) {
                        onStartCall({
                          type: log.callType,
                          isGroup: true,
                          targetId: group.id,
                          targetName: group.name,
                          targetAvatar: group.avatar,
                          participants: group.members
                        });
                      } else if (peer) {
                        onStartCall({
                          type: log.callType,
                          isGroup: false,
                          targetId: peer.id,
                          targetName: store.getDisplayName(peer),
                          targetAvatar: peer.avatar
                        });
                      }
                    }}
                    className="p-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                    title={`Call back (${log.callType})`}
                  >
                    {isVideo ? <Video className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
