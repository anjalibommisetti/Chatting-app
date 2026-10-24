// ==============================================================================
// VibeConnect — Animated GIF Picker & Search Drawer
// High-energy animated GIF stickers and reaction search for Duo Chat
// ==============================================================================

import React, { useState } from 'react';
import { Search, X, Sparkles, Heart, Smile, Flame, PartyPopper, HandHeart } from 'lucide-react';

const GIF_CATEGORIES = [
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'love', label: 'Love ❤️', icon: Heart },
  { id: 'hugs', label: 'Hugs 🤗', icon: HandHeart },
  { id: 'funny', label: 'Funny 😂', icon: Smile },
  { id: 'excited', label: 'Excited 🎉', icon: PartyPopper }
];

// Curated high-quality animated GIFs with reliable CDNs
const CURATED_GIFS = {
  trending: [
    { id: 't1', title: 'Dancing Cat Celebration', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1aHk3dWZid3Z0YWtrN2Y4bHl1azJraTVqYnlvZHRhZGZkaXZ0MSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/JIX9t2j0ZTN9S/giphy.gif' },
    { id: 't2', title: 'Party Confetti', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYWZ0M3U4cG94OXA0OWY4MGk4OXV4ODVvbWpkOXl1cTN2dzB2bHRhMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/artj92V8o75VPL7AeQ/giphy.gif' },
    { id: 't3', title: 'Excited Dance', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXA3YW82OHl1b3kxeTNyMTh5MHliOXk0dG15dDByMG8ycjJ5dmJ4eSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/blSTtZehjAZ8I/giphy.gif' },
    { id: 't4', title: 'Thumbs Up Cool', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm41c2Z0NGMyaTZoNDd0NXJyejU1dzhycjVwMXBvaWVzYXd3M2VjayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/111ebonMs90YLu/giphy.gif' },
    { id: 't5', title: 'Cheering High Five', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjB5cXg2cGc5ejBwaWk5Y2h5OXd4YWtmbG03amk4aG4yZ3FwZ2l4bSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oEjHV0z8S7WM4MwnK/giphy.gif' },
    { id: 't6', title: 'Mind Blown Sparkles', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG13aXh0OHFjcXg3YnV5ZWZzOHk3MW03NDB4cmk0anZjcms2MHpjayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26ufdipQqU2lhNA4g/giphy.gif' }
  ],
  love: [
    { id: 'l1', title: 'Heart Flutter Love', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaW15OHk1OHR2MHZlZ3A2dmJ5dGkxcGk1eDVqNWtrbHRha3o0Z3p0MSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26FLdmIp6wJr91JAI/giphy.gif' },
    { id: 'l2', title: 'Sending Love Hearts', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWNreDlydXZva2NkaWR5eTF3NGp2amZubm5jcnlhcTExOHV6cG10YyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/R6gVNROjZa40w/giphy.gif' },
    { id: 'l3', title: 'Cute Hug Love', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa3IydGl4d3hpeHdtanRxeGZ2ODlnZ2V5OGFobncyOXF0OWJpcGtpNiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3M4NpbLCTxBqU/giphy.gif' },
    { id: 'l4', title: 'Blowing Kiss', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3hveHRiMmZ0Y3V4eGgxbzYwZTB1ZzRxMnRrcnlqa3YxejZ6dXJ3ayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/G3va31oEEnIkM/giphy.gif' },
    { id: 'l5', title: 'Heart Eyes Romance', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExODk2eTB1eXBjZGRrdG10N2w1NDBwOXg2MmRvbzF2MnI0ZnkwODNndSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/uw0KqTWJYYUpC/giphy.gif' },
    { id: 'l6', title: 'I Miss You So Much', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjhzNXR4aWJ5OHhrNDhpNGVjcnN2MHR1b2N1dm14eWl6eDhycTBncyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l4FGpP4lxGGgK5CBW/giphy.gif' }
  ],
  hugs: [
    { id: 'h1', title: 'Warm Big Hug', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaW5obzJ1aG9ubDBpcnBmdW1rNjFicTFxZmVxYmVrNXN6aXV4dW1uNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l8ooTJxKGMuWA/giphy.gif' },
    { id: 'h2', title: 'Cute Teddy Hug', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm1zOHI5c3V3cDhldHNxejdvMnVvODFkMTR4dHk5MXV1OHp1djFrNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/od5H3PmEG5EVq/giphy.gif' },
    { id: 'h3', title: 'Panda Hugging', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGJtODl6MmpkdTRpOW9xcDRpOWt2cDZ5OG1va3N0aHJ5aWgya2F1ZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l2QDM9Jnim1YV5ujC/giphy.gif' },
    { id: 'h4', title: 'Comforting Hug', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnJ2b2c4OGY5b252M3p2dGFyNGpkcGpvYnNndm81YWRwMTQ5Z2dpNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/EvYHHSntaIl5m/giphy.gif' }
  ],
  funny: [
    { id: 'f1', title: 'Laughing Dog', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2JvZWR0ZDNvZ21iYWxsa2tjc21la2Y3ODNnOWdzaHNyM3hnd211eiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/10JhviFuU2gWD6/giphy.gif' },
    { id: 'f2', title: 'Rolling On Floor Laughing', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcG9ld21rOTk5czdrd2lyOXBxaHNldGhkOGhkb2RvaTViZ3c0aWZtNiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ZqlvCTNHpqrio/giphy.gif' },
    { id: 'f3', title: 'Cat Shocked Face', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdzB0eWZudm9pOHh6cXAwNm53b3p3bWZ3OHFwdGpqMHhtdXdrd2ZqdiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/nR4L10X210943/giphy.gif' },
    { id: 'f4', title: 'Popcorn Eating', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHR2OHZpdWw5OXF1bmdybm9hOXQ3aHBtd25jNHVjODVycWZvaTNqYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/GLbiGvv9qrpny/giphy.gif' }
  ],
  excited: [
    { id: 'e1', title: 'Yes Fist Pump', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2ptMTRubnI4czJ0dmx2Y2F4M2ZpNHg4ZjRva2RtdmVwbjAwbWV4diZlcD12MV9naWZzX3NlYXJjaCZjdD1n/nXxOjZrbnbRxS/giphy.gif' },
    { id: 'e2', title: 'Minions Cheering', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc3A0Ynl4N3E2d2JmaWw4MG83ODloMmRzZGJpMXQxaTBxZWhvdDVrcCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/11sBLVxNs7v6WA/giphy.gif' },
    { id: 'e3', title: 'SpongeBob Rainbow', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2R4OTB1MWc2c2xwdnR1ZHBnaHRva3FycjA2OTk3Nms5NXA3czR3ZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/SKGo6OYe24EBG/giphy.gif' }
  ]
};

export default function GifPickerModal({ isOpen, onClose, onSelectGif }) {
  const [activeTab, setActiveTab] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter GIFs
  let currentList = CURATED_GIFS[activeTab] || [];
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    const all = Object.values(CURATED_GIFS).flat();
    currentList = all.filter(g => g.title.toLowerCase().includes(q));
  }

  return (
    <div className="absolute bottom-20 left-2 sm:left-6 z-40 w-[94vw] sm:w-96 max-h-[460px] bg-[#0E1220]/95 border border-purple-500/30 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-fadeIn select-none">
      
      {/* Header */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold font-mono">
            GIF
          </div>
          <span className="font-heading font-bold text-sm text-white">Animated GIFs</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GIFs (e.g. hug, love, laughing)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
            autoFocus
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto scrollbar-none border-b border-white/5">
        {GIF_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id && !searchQuery.trim();
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveTab(cat.id);
                setSearchQuery('');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* GIFs Grid */}
      <div className="p-3 overflow-y-auto max-h-[300px] grid grid-cols-2 gap-2">
        {currentList.map(gif => (
          <button
            key={gif.id}
            onClick={() => {
              onSelectGif({
                url: gif.url,
                name: gif.title,
                type: 'image/gif'
              });
              onClose();
            }}
            className="group relative rounded-xl overflow-hidden bg-black/40 border border-white/5 hover:border-purple-500/50 aspect-video transition-all hover:scale-[1.02] active:scale-98 cursor-pointer focus:outline-none"
          >
            <img
              src={gif.url}
              alt={gif.title}
              className="w-full h-full object-cover rounded-xl"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <span className="text-[10px] text-white font-medium truncate w-full">{gif.title}</span>
            </div>
          </button>
        ))}

        {currentList.length === 0 && (
          <div className="col-span-2 py-8 text-center text-slate-500 text-xs">
            No GIFs found. Try searching for "love", "hug", or "dance"!
          </div>
        )}
      </div>

    </div>
  );
}
