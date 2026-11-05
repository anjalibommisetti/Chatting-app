// ==============================================================================
// VibeChat — Full Categorized Emoji Picker & Reactions Suite
// Hundreds of Unicode emojis, categorized tabs, search filter, and quick inserts
// ==============================================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Smile, ThumbsUp, Heart, Sparkles, Dog, Utensils, Activity, Package } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys & Expressions',
    icon: Smile,
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇',
      '🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑',
      '🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬',
      '🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵',
      '🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','😮',
      '😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖',
      '😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀',
      '☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures & Hands',
    icon: ThumbsUp,
    emojis: [
      '👍','👎','👏','🙌','👐','🤲','🤝','🙏','✌️','🤞','🤟','🤘','🤙',
      '👈','👉','👆','👇','☝️','👋','🤚','🖐','✋','🖖','👌','🤌','🤏',
      '✊','👊','🤛','🤜','💪','🦾','✍️','💅','🤳','🫶','🫂'
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts & Love',
    icon: Heart,
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️',
      '💕','💞','💓','💗','💖','💘','💝','💟','💌','💋','💍','💎'
    ]
  },
  {
    id: 'reactions',
    name: 'Reactions & Magic',
    icon: Sparkles,
    emojis: [
      '🔥','✨','🎉','🚀','💯','⚡️','🌟','⭐','💥','🌈','☀️','🌙','✨',
      '🎈','🎁','🏆','🥇','🎯','🎲','🎨','🎬','🎤','🎧','🎼','🎵','🎶'
    ]
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: Dog,
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷',
      '🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴',
      '🦄','🐝','🐛','🦋','🐌','🐞','🐜','🐢','🐍','🦎','🐙','🦑','🦐',
      '🦞','🦀','🐡','🐠','🐟','🐬','🐳','🦈','🐊','🐾','🌸','🌺','🌹',
      '🌷','🌻','🌼','🌲','🌳','🌴','🌵','🍀','🍁','🍂'
    ]
  },
  {
    id: 'food',
    name: 'Food & Drinks',
    icon: Utensils,
    emojis: [
      '🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥',
      '🥝','🍅','🥑','🥦','🌶','🌽','🥕','🥔','🥐','🍞','🥖','🥨','🧀',
      '🥚','🍳','🥞','🧇','🥓','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🥙',
      '🌮','🌯','🥗','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍧','🍨','🍦',
      '🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','☕️','🧋',
      '🍵','🧃','🥤','🍺','🍻','🥂','🍷','🍹'
    ]
  },
  {
    id: 'objects',
    name: 'Activities & Objects',
    icon: Package,
    emojis: [
      '⚽️','🏀','🏈','⚾️','🎾','🏐','🏓','🏸','🥊','🚴','🛹','🚗','🚕',
      '🏎','🚑','🚲','🛵','🏍','🚨','🚀','✈️','⌚️','📱','💻','🖥','📷',
      '📹','🎙','⏰','💡','🔦','💸','💵','💰','💳','🔧','🔨','📦','✉️',
      '📝','📌','📍','🔒','🔑','🔔','💬','👁‍🗨'
    ]
  }
];

export default function EmojiPickerModal({ isOpen, onClose, onSelectEmoji }) {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const pickerRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const filteredEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      const cat = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
      return cat ? cat.emojis : EMOJI_CATEGORIES[0].emojis;
    }
    // Search across all categories
    const all = EMOJI_CATEGORIES.flatMap(c => c.emojis);
    return Array.from(new Set(all));
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div 
      ref={pickerRef}
      className="absolute bottom-20 left-2 sm:left-6 z-50 w-[320px] sm:w-[380px] bg-[#0E1322]/95 border border-purple-500/30 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-fadeIn select-none"
      style={{ maxHeight: '380px' }}
    >
      {/* Header & Search */}
      <div className="p-3 border-b border-white/10 flex items-center gap-2">
        <div className="flex-1 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emojis..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
            autoFocus
          />
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Icons Tabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-black/20">
        {EMOJI_CATEGORIES.map(cat => {
          const IconComp = cat.icon;
          const isActive = activeCategory === cat.id && !searchQuery;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchQuery('');
              }}
              title={cat.name}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                isActive 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40 scale-105' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconComp className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Scrollable Emoji Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300/80 px-1">
          {searchQuery ? 'Search Results' : EMOJI_CATEGORIES.find(c => c.id === activeCategory)?.name}
        </span>
        <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
          {filteredEmojis.map((emoji, idx) => (
            <button
              key={`${emoji}_${idx}`}
              onClick={() => onSelectEmoji(emoji)}
              className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-xl hover:scale-125 active:scale-95 transition-transform cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

